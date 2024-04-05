import React, { useEffect, useMemo, useState } from 'react';

import { isEqual, omit } from 'lodash';
import { DataSheetGrid, textColumn, keyColumn, intColumn, type Column } from 'react-datasheet-grid';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import type { PointOnMap } from 'applications/operationalStudies/consts';
import {
  osrdEditoastApi,
  type PathfindingRequest,
  type PathResponse,
  type PathWaypoint,
} from 'common/api/osrdEditoastApi';
import { useOsrdConfActions, useOsrdConfSelectors } from 'common/osrdContext';
import { getPathfindingQuery } from 'common/Pathfinding/Pathfinding';
import { useAppDispatch } from 'store';
import type { ArrayElement } from 'utils/types';

type TimesStopsProps = {
  path: PathResponse;
};
const TimesStops = ({ path }: TimesStopsProps) => {
  const { t } = useTranslation('timesStops');

  const { getInfraID, getOrigin, getDestination, getVias, getRollingStockID } =
    useOsrdConfSelectors();

  const infraID = useSelector(getInfraID, isEqual);
  const origin = useSelector(getOrigin, isEqual);
  const destination = useSelector(getDestination, isEqual);
  const vias = useSelector(getVias, isEqual);
  const rollingStockID = useSelector(getRollingStockID, isEqual);

  const dispatch = useAppDispatch();
  const { replaceVias, updateSuggeredVias, updateItinerary } = useOsrdConfActions();

  const [postPathfinding] = osrdEditoastApi.endpoints.postPathfinding.useMutation();

  const [timesStopsSteps, setTimesStopsSteps] = useState<PathWaypoint[]>(path.steps);

  const transformVias = ({ steps }: PathResponse) => {
    if (steps && steps.length >= 2) {
      const stepsAsPointOnMap: PointOnMap[] = steps.map((step) => ({
        ...omit(step, ['geo']),
        coordinates: step.geo?.coordinates,
        id: step.id || undefined,
        name: step.name || undefined,
      }));
      const newVias = steps.slice(1, -1).flatMap((step: ArrayElement<PathResponse['steps']>) => {
        const viaCoordinates = step.geo?.coordinates;
        if (!!step.duration && viaCoordinates) {
          return [
            {
              ...omit(step, ['geo']),
              coordinates: viaCoordinates,
              id: step.id || undefined,
              name: step.name || undefined,
              suggestion: false,
            },
          ];
        }
        return [];
      });
      dispatch(replaceVias(newVias));
      dispatch(updateSuggeredVias(stepsAsPointOnMap));
    }
  };
  const generatePathfindingParams = (): PathfindingRequest | null => {
    dispatch(updateItinerary(undefined));
    return getPathfindingQuery({ infraID, rollingStockID, origin, destination, vias });
  };

  useEffect(() => {
    const newPath = { ...path, steps: timesStopsSteps };
    transformVias(newPath);
    dispatch(updateItinerary(newPath));
    const params = generatePathfindingParams();
    postPathfinding({ pathfindingRequest: params! });
  }, [timesStopsSteps]);

  type PathWaypointColumn = Omit<PathWaypoint, 'duration'> & {
    duration: number | null;
  };

  const columns: Column<PathWaypointColumn>[] = useMemo(
    () => [
      {
        ...keyColumn<PathWaypointColumn, 'name'>('name', textColumn),
        title: t('name'),
        disabled: true,
      },
      {
        ...keyColumn<PathWaypointColumn, 'ch'>('ch', textColumn),
        title: 'Ch',
        disabled: true,
        grow: 0.1,
      },
      {
        ...keyColumn<PathWaypointColumn, 'duration'>('duration', intColumn),
        title: t('stop_time'),
      },
    ],
    [t]
  );

  return (
    <DataSheetGrid
      columns={columns}
      value={timesStopsSteps}
      onChange={(e) => {
        setTimesStopsSteps(e as PathWaypoint[]);
      }}
      lockRows
      rowClassName={({ rowData }) => (!rowData.suggestion ? 'activeRow' : '')}
      height={600}
    />
  );
};

export default TimesStops;
