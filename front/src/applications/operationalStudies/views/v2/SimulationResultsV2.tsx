import React, { useEffect, useState, useRef } from 'react';

import cx from 'classnames';
import { useSelector } from 'react-redux';

import { useSimulationResults } from 'applications/operationalStudies/hooks';
import {
  type PostV2TrainScheduleProjectPathApiResponse,
  type ProjectPathTrainResult,
} from 'common/api/osrdEditoastApi';
import getScaleDomainFromValues from 'modules/simulationResult/components/ChartHelpers/getScaleDomainFromValues';
import SimulationResultsMapV2 from 'modules/simulationResult/components/SimulationResultsMapV2';
import SpeedSpaceChartV2 from 'modules/simulationResult/components/SpeedSpaceChart/SpeedSpaceChartV2';
import TimeButtonsV2 from 'modules/simulationResult/components/TimeButtonsV2';
import TrainDetailsV2 from 'modules/simulationResult/components/TrainDetailsV2';
import type { PositionScaleDomain } from 'modules/simulationResult/types';
import { updateViewport, type Viewport } from 'reducers/map';
import { updateTrainIdUsedForProjection } from 'reducers/osrdsimulation/actions';
import { getIsUpdating } from 'reducers/osrdsimulation/selectors';
import {
  persistentRedoSimulation,
  persistentUndoSimulation,
} from 'reducers/osrdsimulation/simulation';
// TIMELINE DISABLED // import TimeLine from 'modules/simulationResult/components/TimeLine/TimeLine';
import { useAppDispatch } from 'store';

const MAP_MIN_HEIGHT = 450;

type SimulationResultsV2Props = {
  collapsedTimetable: boolean;
  setTrainResultsToFetch: (trainSchedulesIDs?: number[]) => void;
  spaceTimeData?: PostV2TrainScheduleProjectPathApiResponse;
};

const SimulationResultsV2 = ({
  collapsedTimetable,
  setTrainResultsToFetch,
  spaceTimeData,
}: SimulationResultsV2Props) => {
  //   const { t } = useTranslation('simulation');
  const dispatch = useAppDispatch();

  // TIMELINE DISABLED // const { chart } = useSelector(getOsrdSimulation);
  const isUpdating = useSelector(getIsUpdating);

  const timeTableRef = useRef<HTMLDivElement | null>(null);
  const [extViewport, setExtViewport] = useState<Viewport | undefined>(undefined);
  //   const [showWarpedMap, setShowWarpedMap] = useState(false);

  //   const [heightOfSpaceTimeChart, setHeightOfSpaceTimeChart] = useState(600);
  const [heightOfSpeedSpaceChart, setHeightOfSpeedSpaceChart] = useState(250);
  const [heightOfSimulationMap] = useState(MAP_MIN_HEIGHT);
  // const [heightOfSpaceCurvesSlopesChart, setHeightOfSpaceCurvesSlopesChart] = useState(150);
  // const [initialHeightOfSpaceCurvesSlopesChart, setInitialHeightOfSpaceCurvesSlopesChart] =
  //   useState(heightOfSpaceCurvesSlopesChart);

  //   const [timeScaleDomain, setTimeScaleDomain] = useState<TimeScaleDomain>({
  //     range: undefined,
  //     source: undefined,
  //   });

  // X scale domain shared between SpeedSpace and SpaceCurvesSlopes charts.
  const [positionScaleDomain, setPositionScaleDomain] = useState<PositionScaleDomain>({
    initial: [],
    current: [],
    source: undefined,
  });

  const {
    selectedTrainId,
    selectedTrainRollingStock,
    selectedTrainPowerRestrictions,
    trainSimulation,
    pathProperties,
    pathLength,
  } = useSimulationResults();

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'z' && e.metaKey) {
      dispatch(persistentUndoSimulation());
    }
    if (e.key === 'e' && e.metaKey) {
      dispatch(persistentRedoSimulation());
    }
  };

  useEffect(() => {
    // Setup the listener to undi /redo
    window.addEventListener('keydown', handleKey);
    return function cleanup() {
      window.removeEventListener('keydown', handleKey);
      dispatch(updateTrainIdUsedForProjection(undefined));
    };
  }, []);

  useEffect(() => {
    if (extViewport !== undefined) {
      dispatch(
        updateViewport({
          ...extViewport,
        })
      );
    }
  }, [extViewport]);

  useEffect(() => {
    if (trainSimulation && trainSimulation.status === 'success') {
      const { positions } = trainSimulation.base;
      const newPositionsScaleDomain = getScaleDomainFromValues(positions);
      setPositionScaleDomain({
        initial: newPositionsScaleDomain,
        current: newPositionsScaleDomain,
      });
    }
  }, [trainSimulation]);

  if (!trainSimulation) return null;

  return trainSimulation.status !== 'success' && !isUpdating ? null : (
    <div className="simulation-results">
      {/* SIMULATION : STICKY BAR */}
      {spaceTimeData && selectedTrainId && (
        <div
          className={cx('osrd-simulation-sticky-bar', {
            'with-collapsed-timetable': collapsedTimetable,
          })}
        >
          <div className="row">
            <div className="col-xl-4">
              <TimeButtonsV2 departureTime={spaceTimeData[selectedTrainId].departure_time} />
            </div>
            <TrainDetailsV2 spaceTimeData={spaceTimeData[selectedTrainId]} />
          </div>
        </div>
      )}

      {/* SIMULATION: TIMELINE — TEMPORARILY DISABLED
      {simulation.trains.length && (
        <TimeLine
          timeScaleDomain={timeScaleDomain}
          selectedTrainId={selectedTrain?.id || simulation.trains[0].id}
          trains={simulation.trains as SimulationReport[]}
          onTimeScaleDomainChange={setTimeScaleDomain}
        />
      )}
      */}

      {/* SIMULATION : SPACE TIME CHART */}
      {spaceTimeData && (
        <div className="simulation-warped-map d-flex flex-row align-items-stretch mb-2 bg-white">
          {/* <button
            type="button"
            className="show-warped-map-button my-3 ml-3 mr-1"
            aria-label={t('toggleWarpedMap')}
            title={t('toggleWarpedMap')}
            onClick={() => setShowWarpedMap(!showWarpedMap)}
          >
            {showWarpedMap ? <ChevronLeft /> : <ChevronRight />}
          </button>
          <SimulationWarpedMap collapsed={!showWarpedMap} />

          <div className="osrd-simulation-container d-flex flex-grow-1 flex-shrink-1">
            <div className="chart-container" style={{ height: `${heightOfSpaceTimeChart}px` }}>
              <SpaceTimeChart
                allowancesSettings={allowancesSettings}
                inputSelectedTrain={selectedTrain}
                trainIdUsedForProjection={trainIdUsedForProjection}
                simulation={simulation}
                simulationIsPlaying={simulationIsPlaying}
                initialHeight={heightOfSpaceTimeChart}
                onSetBaseHeight={setHeightOfSpaceTimeChart}
                dispatchUpdateSelectedTrainId={dispatchUpdateSelectedTrainId}
                dispatchPersistentUpdateSimulation={dispatchPersistentUpdateSimulation}
                setTrainResultsToFetch={setTrainResultsToFetch}
                timeScaleDomain={timeScaleDomain}
                setTimeScaleDomain={setTimeScaleDomain}
                // spaceTimeData={spaceTimeDate}
              />
            </div>
          </div> */}
        </div>
      )}

      {/* TRAIN : SPACE SPEED CHART */}
      {selectedTrainRollingStock && trainSimulation && pathProperties && (
        <div className="osrd-simulation-container d-flex mb-2">
          <div className="chart-container" style={{ height: `${heightOfSpeedSpaceChart}px` }}>
            <SpeedSpaceChartV2
              initialHeight={heightOfSpeedSpaceChart}
              onSetChartBaseHeight={setHeightOfSpeedSpaceChart}
              trainRollingStock={selectedTrainRollingStock}
              trainSimulation={trainSimulation}
              selectedTrainPowerRestrictions={selectedTrainPowerRestrictions}
              pathProperties={pathProperties}
              pathLength={pathLength}
              sharedXScaleDomain={positionScaleDomain}
              setSharedXScaleDomain={setPositionScaleDomain}
            />
          </div>
        </div>
      )}

      {/* TRAIN : CURVES & SLOPES */}
      {/* <div className="osrd-simulation-container d-flex mb-2">
        <div className="chart-container" style={{ height: `${heightOfSpaceCurvesSlopesChart}px` }}>
          {selectedTrain && (
            <Rnd
              default={{
                x: 0,
                y: 0,
                width: '100%',
                height: `${heightOfSpaceCurvesSlopesChart}px`,
              }}
              disableDragging
              enableResizing={{
                bottom: true,
              }}
              onResizeStart={() =>
                setInitialHeightOfSpaceCurvesSlopesChart(heightOfSpaceCurvesSlopesChart)
              }
              onResize={(_e, _dir, _refToElement, delta) => {
                setHeightOfSpaceCurvesSlopesChart(
                  initialHeightOfSpaceCurvesSlopesChart + delta.height
                );
              }}
            >
              <SpaceCurvesSlopes
                initialHeight={heightOfSpaceCurvesSlopesChart}
                selectedTrain={selectedTrain as Train} // TODO: remove Train interface
                sharedXScaleDomain={positionScaleDomain}
                setSharedXScaleDomain={setPositionScaleDomain}
              />
            </Rnd>
          )}
        </div>
      </div> */}

      {/* TRAIN : DRIVER TRAIN SCHEDULE */}
      {/* {selectedTrain && selectedTrainRollingStock && (
        <div className="osrd-simulation-container mb-2">
          <DriverTrainSchedule
            train={selectedTrain as Train} // TODO: remove Train interface
            rollingStock={selectedTrainRollingStock}
          />
        </div>
      )} */}

      {/* SIMULATION : MAP */}
      <div ref={timeTableRef}>
        <div className="osrd-simulation-container mb-2">
          <div className="osrd-simulation-map" style={{ height: `${heightOfSimulationMap}px` }}>
            <SimulationResultsMapV2
              setExtViewport={setExtViewport}
              geometry={pathProperties?.geometry}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationResultsV2;
