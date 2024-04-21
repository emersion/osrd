import React, { useMemo, useState, useEffect } from 'react';

import type { Position } from 'geojson';
import {
  DataSheetGrid,
  textColumn,
  keyColumn,
  intColumn,
  type Column,
  checkboxColumn,
} from 'react-datasheet-grid';
import { useTranslation } from 'react-i18next';

import {
  osrdEditoastApi,
  type PathfindingResult,
  type PathProperties,
  type PathWaypoint,
  type TrackRange,
} from 'common/api/osrdEditoastApi';
import DATATEST from 'common/Pathfinding/dataTest';
import { useInfraID } from 'common/osrdContext';

type TimesStopsProps = {
  path: PathfindingResult;
};

type SuggestedOP = {
  prId: string;
  name: string | null;
  uic?: number;
  ch: string | null;
  ch_long_label?: string;
  ch_short_label?: string;
  ci?: number;
  trigram?: string;
  offsetOnTrack: number;
  track: string;
  /** Distance from the beginning of the path in mm */
  positionOnPath: number;
  coordinates: Position;
  /** Id of the path step which will be defined only when the OP is transformed into a via */
  stepId?: string;
  /** Metadata given to mark a point as wishing to be deleted by the user.
        It's useful for soft deleting the point (waiting to fix / remove all references)
        If true, the train schedule is consider as invalid and must be edited */
  deleted?: boolean;
  arrival?: string | null;
  locked?: boolean;
  stop_for?: string | null;
};

const formatOPsToSuggestOPs = (
  operationalPoints: PathProperties['operational_points']
): SuggestedOP[] => {
  const suggestedOPs: SuggestedOP[] = [];
  operationalPoints?.forEach((op) => {
    const { extensions, id, part, position } = op;
    if (!extensions) return;
    const { identifier, sncf } = extensions;
    if (!identifier || !sncf) return;
    const { name, uic } = identifier;
    const { ch, ch_long_label, ch_short_label, ci, trigram } = sncf;
    const { track } = part;
    const positionOnPath = position;
    suggestedOPs.push({
      prId: id,
      name,
      uic,
      ch,
      ch_long_label,
      ch_short_label,
      ci,
      trigram,
      offsetOnTrack: 0,
      track,
      positionOnPath,
      coordinates: [0, 0],
    });
  });
  return suggestedOPs;
};
const TimesStops = ({ path }: TimesStopsProps) => {
  const { t } = useTranslation('timesStops');
  const infraID = useInfraID();

  const [postPathProperties] =
    osrdEditoastApi.endpoints.postV2InfraByInfraIdPathProperties.useMutation();
  const [timesStopsSteps, setTimesStopsSteps] = useState<Partial<PathWaypointColumn>[] | undefined>(
    undefined
  );

  useEffect(() => {
    postPathProperties({
      infraId: infraID as number,
      pathPropertiesInput: {
        track_ranges: path.track_section_ranges as TrackRange[],
      },
    })
      .unwrap()
      .then((result) => {
        const suggestedOPs = formatOPsToSuggestOPs(DATATEST);
        setTimesStopsSteps(suggestedOPs);
      });
  }, [path]);

  type PathWaypointColumn = SuggestedOP & {
    duration: number | null;
    arrival_time: string | null;
    departure_time: string | null;
    reception_on_closed_signal: boolean;
    theoretical_margin: string | null;
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
        ...keyColumn<PathWaypointColumn, 'arrival_time'>('arrival_time', textColumn),
        title: t('arrival_time'),
        grow: 0.5,
      },
      {
        ...keyColumn<PathWaypointColumn, 'departure_time'>('departure_time', textColumn),
        title: t('departure_time'),
        grow: 0.5,
      },
      {
        ...keyColumn<PathWaypointColumn, 'duration'>('duration', intColumn),
        title: t('stop_time'),
      },
      {
        ...keyColumn<PathWaypointColumn, 'reception_on_closed_signal'>(
          'reception_on_closed_signal',
          checkboxColumn
        ),
        title: t('reception_on_closed_signal'),
      },
      {
        ...keyColumn<PathWaypointColumn, 'theoretical_margin'>('theoretical_margin', textColumn),
        title: t('theoretical_margin'),
      },
    ],
    [t]
  );

  return (
    <DataSheetGrid
      columns={columns}
      value={timesStopsSteps}
      onChange={(e) => {
        setTimesStopsSteps(e as PathWaypointColumn[]);
      }}
      lockRows
      height={600}
    />
  );
};

export default TimesStops;
