package fr.sncf.osrd.stdcm.graph

import fr.sncf.osrd.sim_infra.api.Block
import fr.sncf.osrd.stdcm.infra_exploration.InfraExplorerWithEnvelope
import fr.sncf.osrd.utils.units.Length
import fr.sncf.osrd.utils.units.Offset
import fr.sncf.osrd.utils.units.meters
import java.util.*

data class STDCMEdge(
    val infraExplorer:
        InfraExplorerWithEnvelope, // Instance used to explore the infra, contains the current
    // underlying edge (block)
    val infraExplorerWithNewEnvelope: InfraExplorerWithEnvelope, // Includes this edge's envelope
    val timeStart: Double, // Time at which the train enters the block
    val maximumAddedDelayAfter:
        Double, // Maximum delay we can add after this block by delaying the start time without
    // causing conflicts
    val addedDelay:
        Double, // Delay we needed to add in this block to avoid conflicts (by shifting the
    // departure time)
    val timeNextOccupancy:
        Double, // Time of the next occupancy of the block, used to identify the "opening" used by
    // the edge
    val totalDepartureTimeShift:
        Double, // Total delay we have added by shifting the departure time since the start of the
    // path
    val previousNode:
        STDCMNode?, // Node located at the start of this edge, null if this is the first edge
    val envelopeStartOffset:
        Offset<Block>, // Offset of the envelope if it doesn't start at the beginning of the edge
    val minuteTimeStart:
        Int, // Time at which the train enters the block, discretized by only considering the
    // minutes.
    // Used to identify visited edges
    val standardAllowanceSpeedFactor: Double, // Speed factor used to account for standard allowance
    // e.g. if we have a 5% standard allowance, this value is 1/1.05.
    val waypointIndex: Int, // Index of the last waypoint passed by this train
    val endAtStop: Boolean, // True if the edge end is a stop
    val beginSpeed: Double, // Speed at the beginning of the edge
    val endSpeed: Double, // Speed at the end of the edge
    val length: Length<STDCMEdge>, // Edge length
    val totalTime:
        Double, // How long it takes to go from the beginning to the end of the block, taking the
    // standard allowance into account
    var weight: Double? = null // Weight (total distance from start + estimation to end) of the edge
) : Comparable<STDCMEdge> {
    val block = infraExplorer.getCurrentBlock()

    override fun equals(other: Any?): Boolean {
        if (other == null || other.javaClass != STDCMEdge::class.java) return false
        val otherEdge = other as STDCMEdge
        return if (
            infraExplorer.getLastEdgeIdentifier() != otherEdge.infraExplorer.getLastEdgeIdentifier()
        )
            false
        else
            minuteTimeStart == otherEdge.minuteTimeStart &&
                envelopeStartOffset == otherEdge.envelopeStartOffset

        // We need to consider that the edges aren't equal if the times are different,
        // but if we do it "naively" we end up visiting the same places a near-infinite number of
        // times.
        // We handle it by discretizing the start time of the edge: we round the time down to the
        // minute and compare
        // this value.
    }

    override fun compareTo(other: STDCMEdge): Int {
        return if (weight != other.weight) weight!!.compareTo(other.weight!!)
        else {
            // If the weights are equal, we prioritize the highest number of reached targets
            other.waypointIndex - waypointIndex
        }
    }

    override fun hashCode(): Int {
        return Objects.hash(
            infraExplorer.getLastEdgeIdentifier(),
            minuteTimeStart,
            envelopeStartOffset
        )
    }

    /** Returns the node at the end of this edge */
    fun getEdgeEnd(graph: STDCMGraph): STDCMNode {
        var newWaypointIndex = waypointIndex
        while (newWaypointIndex + 1 < graph.steps.size) {
            val nextStep = graph.steps[newWaypointIndex + 1]
            val endOffset = envelopeStartOffset + length.distance
            val pass =
                nextStep.locations.any {
                    it.edge == block && it.offset <= endOffset && it.offset >= envelopeStartOffset
                }
            if (!pass) break
            newWaypointIndex++
        }
        return if (!endAtStop) {
            // We move on to the next block
            STDCMNode(
                totalTime + timeStart,
                endSpeed,
                infraExplorerWithNewEnvelope,
                totalDepartureTimeShift,
                maximumAddedDelayAfter,
                this,
                newWaypointIndex,
                null,
                null
            )
        } else {
            // New edge on the same block, after a stop
            val stopDuration = graph.getFirstStopAfterIndex(waypointIndex)!!.duration!!
            STDCMNode(
                totalTime + timeStart + stopDuration,
                endSpeed,
                infraExplorerWithNewEnvelope,
                totalDepartureTimeShift,
                maximumAddedDelayAfter,
                this,
                newWaypointIndex,
                envelopeStartOffset + length.distance,
                stopDuration
            )
        }
    }

    /**
     * Returns the approximate time of the given offset of the edge. Runs a simple linear
     * interpolation.
     */
    fun getApproximateTimeAtLocation(offset: Offset<STDCMEdge>): Double {
        if (length.distance == 0.meters) return timeStart // Avoids division by 0
        val offsetRatio = offset.distance.meters / length.distance.meters
        return timeStart + (totalTime * offsetRatio)
    }

    override fun toString(): String {
        return "STDCMEdge(timeStart=$timeStart, block=$block)"
    }
}
