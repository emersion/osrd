package fr.sncf.osrd.train.phases;

import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import fr.sncf.osrd.infra.TVDSection;
import fr.sncf.osrd.infra.routegraph.Route;
import fr.sncf.osrd.infra.signaling.ActionPoint;
import fr.sncf.osrd.infra.signaling.AspectConstraint;
import fr.sncf.osrd.infra.signaling.Signal;
import fr.sncf.osrd.infra.trackgraph.Detector;
import fr.sncf.osrd.infra.trackgraph.TrackSection;
import fr.sncf.osrd.infra.trackgraph.Waypoint;
import fr.sncf.osrd.infra_state.SignalState;
import fr.sncf.osrd.simulation.Simulation;
import fr.sncf.osrd.simulation.SimulationError;
import fr.sncf.osrd.simulation.TimelineEvent;
import fr.sncf.osrd.speedcontroller.LimitAnnounceSpeedController;
import fr.sncf.osrd.speedcontroller.MaxSpeedController;
import fr.sncf.osrd.speedcontroller.SpeedController;
import fr.sncf.osrd.train.*;
import fr.sncf.osrd.train.events.TrainMoveEvent;
import fr.sncf.osrd.train.events.TrainReachesActionPoint;
import fr.sncf.osrd.utils.TrackSectionLocation;

import java.util.*;
import java.util.function.Consumer;
import java.util.function.Predicate;

public final class SignalNavigatePhase implements Phase {
    public final List<Route> routePath;
    public final TrackSectionLocation endLocation;
    private final ArrayList<TrackSectionRange> trackSectionPath;
    private final ArrayList<Interaction> interactionsPath;

    private SignalNavigatePhase(
            List<Route> routePath,
            TrackSectionLocation endLocation,
            ArrayList<TrackSectionRange> trackSectionPath,
            ArrayList<Interaction> interactionsPath
    ) {
        this.routePath = routePath;
        this.endLocation = endLocation;
        this.trackSectionPath = trackSectionPath;
        this.interactionsPath = interactionsPath;
    }



    /** Create a new navigation phase from an already determined path */
    public static SignalNavigatePhase from(
            List<Route> routes,
            double driverSightDistance,
            TrackSectionLocation startLocation,
            TrackSectionLocation endLocation
    ) {
        var trackSectionPath = Route.routesToTrackSectionRange(routes, startLocation, endLocation);
        var actionPointPath = trackSectionToActionPointPath(driverSightDistance, trackSectionPath);
        return new SignalNavigatePhase(routes, endLocation, trackSectionPath, actionPointPath);
    }

    private static ArrayList<Interaction> trackSectionToActionPointPath(
            double driverSightDistance,
            Iterable<TrackSectionRange> trackSectionRanges
    ) {
        var eventPath = new ArrayList<Interaction>();
        double pathLength = 0;
        for (var trackRange : trackSectionRanges) {
            for (var interactablePoint : TrackSection.getInteractables(trackRange.edge, trackRange.direction)) {
                if (!trackRange.containsPosition(interactablePoint.position))
                    continue;

                var interactable = interactablePoint.value;
                var edgeDistToObj = Math.abs(interactablePoint.position - trackRange.getBeginPosition());

                if (interactable.getInteractionsType().interactWithHead()) {
                    var distance = pathLength + edgeDistToObj;
                    eventPath.add(new Interaction(InteractionType.HEAD, distance, interactable));
                }
                if (interactable.getInteractionsType().interactWhenSeen()) {
                    var sightDistance = Double.min(interactable.getActionDistance(), driverSightDistance);
                    var distance = pathLength + edgeDistToObj - sightDistance;
                    if (distance < 0)
                        distance = 0;
                    eventPath.add(new Interaction(InteractionType.SEEN, distance, interactable));
                }
            }
            pathLength += trackRange.length();
        }

        Collections.sort(eventPath);

        // If no action point at the very end of the path then add a virtual action point
        if (eventPath.isEmpty() || eventPath.get(eventPath.size() - 1).position < pathLength) {
            var virtualActionPoint = new VirtualActionPoint();
            eventPath.add(new Interaction(InteractionType.HEAD, pathLength, virtualActionPoint));
        }
        return eventPath;
    }

    @Override
    public PhaseState getState() {
        return new State(this);
    }

    @Override
    public TrackSectionLocation getEndLocation() {
        return endLocation;
    }

    @Override
    public void forEachPathSection(Consumer<TrackSectionRange> consumer) {
        trackSectionPath.forEach(consumer);
    }

    /** This class represent an empty action point. It's as last event in the event path */
    public static final class VirtualActionPoint implements ActionPoint {

        @Override
        public InteractionTypeSet getInteractionsType() {
            return new InteractionTypeSet();
        }

        @Override
        public double getActionDistance() {
            return 0;
        }

        @Override
        public void interact(Simulation sim, Train train, InteractionType actionType) { }

        @Override
        public String toString() {
            return "VirtualActionPoint { }";
        }
    }

    public static final class State extends PhaseState {
        public final SignalNavigatePhase phase;
        private int routeIndex = 0;
        private int interactionsPathIndex = 0;
        private final transient HashMap<Signal, ArrayList<SpeedController>> signalControllers = new HashMap<>();

        @Override
        @SuppressFBWarnings({"BC_UNCONFIRMED_CAST"})
        public boolean deepEquals(PhaseState other) {
            if (other.getClass() != State.class)
                return false;
            var o = (State) other;
            return o.phase == phase && o.routeIndex == routeIndex && o.interactionsPathIndex == interactionsPathIndex;
        }

        public State(SignalNavigatePhase phase) {
            this.phase = phase;
        }

        private boolean isInteractionUnderTrain(TrainState trainState) {
            var nextFrontalInteraction = phase.interactionsPath.get(interactionsPathIndex);

            double nextBackInteractionDistance = Double.POSITIVE_INFINITY;
            if (!trainState.actionPointsUnderTrain.isEmpty())
                nextBackInteractionDistance = trainState.actionPointsUnderTrain.getFirst().position;

            return nextBackInteractionDistance < nextFrontalInteraction.position;
        }

        /** Return the first interaction that satisfies the predicate. */
        public Interaction findFirstInteractions(TrainState trainState, Predicate<Interaction> predicate) {
            var interactionIndex = interactionsPathIndex;
            for (var underTrain : trainState.actionPointsUnderTrain) {
                var posUnderTrain = underTrain.position;
                while (interactionIndex < phase.interactionsPath.size()
                        && phase.interactionsPath.get(interactionIndex).position < posUnderTrain) {
                    var interaction = phase.interactionsPath.get(interactionIndex);
                    if (predicate.test(interaction))
                        return interaction;
                    interactionIndex++;
                }
                if (predicate.test(underTrain))
                    return underTrain;
            }
            while (interactionIndex < phase.interactionsPath.size()) {
                var interaction = phase.interactionsPath.get(interactionIndex);
                if (predicate.test(interaction))
                    return interaction;
                interactionIndex++;
            }
            return null;
        }

        private Interaction peekInteraction(TrainState trainState) {
            // Interact with next action point under the train
            if (isInteractionUnderTrain(trainState))
                return trainState.actionPointsUnderTrain.peekFirst();

            // Interact with next action point in front of the train
            return phase.interactionsPath.get(interactionsPathIndex);
        }

        private void popInteraction(TrainState trainState) {
            if (isInteractionUnderTrain(trainState))
                trainState.actionPointsUnderTrain.removeFirst();
            else
                interactionsPathIndex++;
        }

        @Override
        public TimelineEvent simulate(Simulation sim, Train train, TrainState trainState) throws SimulationError {
            // Check if we reached our goal
            if (interactionsPathIndex == phase.interactionsPath.size()) {
                var change = new Train.TrainStateChange(sim, train.getName(), trainState.nextPhase());
                change.apply(sim, train);
                sim.publishChange(change);
                return null;
            }

            // 1) find the next interaction event
            var nextInteraction = peekInteraction(trainState);

            // 2) If the action point can interact with the tail of the train add it to the interaction list
            addInteractionUnderTrain(trainState, nextInteraction);

            // 3) simulate up to nextEventTrackPosition
            var simulationResult = trainState.evolveStateUntilPosition(sim, nextInteraction.position);

            // 4) create an event with simulation data up to this point
            // The train reached the action point
            if (trainState.location.getPathPosition() >= nextInteraction.position) {
                popInteraction(trainState);
                return TrainReachesActionPoint.plan(sim, trainState.time, train, simulationResult, nextInteraction);
            }
            // The train didn't reached the action point
            return TrainMoveEvent.plan(sim, trainState.time, train, simulationResult);
        }

        private static void addInteractionUnderTrain(TrainState trainState, Interaction interaction) {
            if (interaction.interactionType == InteractionType.TAIL)
                return;
            if (!interaction.actionPoint.getInteractionsType().interactWithTail())
                return;

            var trainLength = trainState.trainSchedule.rollingStock.length;
            var underTrainInteraction = new Interaction(
                    InteractionType.TAIL,
                    interaction.position + trainLength,
                    interaction.actionPoint
            );
            trainState.actionPointsUnderTrain.addLast(underTrainInteraction);
        }

        private TVDSection findForwardTVDSection(Waypoint waypoint) {
            // TODO: Find a faster and smarter way to do it
            for (var route : phase.routePath) {
                for (var j = 0; j < route.tvdSectionsPaths.size(); j++) {
                    var tvdSectionPath = route.tvdSectionsPaths.get(j);
                    var tvdSectionPathDirection = route.tvdSectionsPathDirections.get(j);
                    if (tvdSectionPath.getStartNode(tvdSectionPathDirection) == waypoint.index)
                        return tvdSectionPath.tvdSection;
                }
            }
            throw new RuntimeException("Can't find the waypoint in the planned route path");
        }

        private TVDSection findBackwardTVDSection(Waypoint waypoint) {
            // TODO: Find a faster and smarter way to do it
            for (var route : phase.routePath) {
                for (var j = 0; j < route.tvdSectionsPaths.size(); j++) {
                    var tvdSectionPath = route.tvdSectionsPaths.get(j);
                    var tvdSectionPathDirection = route.tvdSectionsPathDirections.get(j);
                    if (tvdSectionPath.getEndNode(tvdSectionPathDirection) == waypoint.index)
                        return tvdSectionPath.tvdSection;
                }
            }
            throw new RuntimeException("Can't find the waypoint in the planned route path");
        }

        /** Occupy and free tvd sections given a detector the train is interacting with. */
        public void updateTVDSections(
                Simulation sim,
                Detector detector,
                InteractionType interactionType
        ) throws SimulationError {
            // Update route index
            var currentRoute = phase.routePath.get(routeIndex);
            var tvdSectionPathIndex = currentRoute.tvdSectionsPaths.size() - 1;
            var lastTvdSectionPath = currentRoute.tvdSectionsPaths.get(tvdSectionPathIndex);
            var lastTvdSectionPathDir = currentRoute.tvdSectionsPathDirections.get(tvdSectionPathIndex);
            if (lastTvdSectionPath.getEndNode(lastTvdSectionPathDir) == detector.index)
                routeIndex++;

            // Occupy the next tvdSection
            if (interactionType == InteractionType.HEAD) {
                var forwardTVDSectionPath = findForwardTVDSection(detector);
                var nextTVDSection = sim.infraState.getTvdSectionState(forwardTVDSectionPath.index);
                nextTVDSection.occupy(sim);
                return;
            }
            // Doesn't occupy the last tvdSection
            var backwardTVDSectionPath = findBackwardTVDSection(detector);
            var backwardTVDSection = sim.infraState.getTvdSectionState(backwardTVDSectionPath.index);
            backwardTVDSection.unoccupy(sim);
        }

        public int getRouteIndex() {
            return routeIndex;
        }

        private ArrayList<SpeedController> parseAspectConstraint(AspectConstraint constraint, TrainState trainState) {
            if (constraint.getClass() == AspectConstraint.SpeedLimit.class) {
                var speedLimit = (AspectConstraint.SpeedLimit) constraint;
                var appliesAt = speedLimit.appliesAt.convert(this, trainState);
                var until = speedLimit.until.convert(this, trainState);
                var res = new ArrayList<SpeedController>();
                res.add(LimitAnnounceSpeedController.create(
                        trainState.trainSchedule.rollingStock.maxSpeed,
                        speedLimit.speed,
                        appliesAt,
                        trainState.trainSchedule.rollingStock.timetableGamma
                ));
                res.add(new MaxSpeedController(
                        speedLimit.speed,
                        appliesAt,
                        until
                ));
                return res;
            }
            throw new RuntimeException("AspectConstraint not handled");
        }

        /** Add or update aspects constraint of a signal */
        public void setAspectConstraints(SignalState signalState, TrainState trainState) {
            var controllers = new ArrayList<SpeedController>();
            for (var aspect : signalState.aspects) {
                for (var constraint : aspect.constraints)
                    controllers.addAll(parseAspectConstraint(constraint, trainState));
            }
            signalControllers.put(signalState.signal, controllers);
        }

        @Override
        public ArrayList<SpeedController> getSpeedControllers() {
            var controllers = new ArrayList<SpeedController>();
            for (var signalControllers : signalControllers.values())
                controllers.addAll(signalControllers);
            return controllers;
        }
    }
}
