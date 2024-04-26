import React, { useMemo, useState, useEffect } from 'react';

import type { Position } from 'geojson';
import {
  DataSheetGrid,
  keyColumn,
  type Column,
  checkboxColumn,
  createTextColumn,
  type CellProps,
} from 'react-datasheet-grid';
import { useTranslation } from 'react-i18next';

import type { ManageTrainSchedulePathProperties } from 'applications/operationalStudies/views/v2/ManageTrainScheduleV2';
import { type PathProperties } from 'common/api/osrdEditoastApi';
import DATATEST from 'common/Pathfinding/dataTest';

type TimesStopsProps = {
  pathProperties?: ManageTrainSchedulePathProperties;
};

type SuggestedOP = {
  prId: string;
  name: string;
  uic?: number;
  ch: string;
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
  stop_for?: string;
};

const marginRegExValidation = /^\d+(\.\d+)?%$|^\d+(\.\d+)?min\/km$/;

const formatOPsToSuggestOPs = (
  operationalPoints: PathProperties['operational_points']
): PathWaypointColumn[] => {
  const suggestedOPs: PathWaypointColumn[] = [];
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
      arrival_time: null,
      departure_time: null,
      duration: 0,
      reception_on_closed_signal: false,
      theoretical_margin: null,
      isMarginValid: true,
    });
  });
  return suggestedOPs;
};

type PathWaypointColumn = SuggestedOP & {
  duration: number;
  arrival_time: string | null;
  departure_time: string | null;
  reception_on_closed_signal: boolean;
  theoretical_margin: string | null;
  isMarginValid: boolean;
};

const TimeComponent = ({
  rowData,
  setRowData,
  rowIndex,
  columnIndex,
}: CellProps<string | null, any>) => (
  <input
    id={`time-${rowIndex}-${columnIndex}`}
    type="time"
    value={rowData!}
    onChange={(e) => {
      console.log('rowData:', rowData);
      setRowData(e.target.value);
    }}
    className="dsg-input"
    step="1"
  />
);

const timeColumn: Partial<Column<string | null, any, string>> = {
  component: TimeComponent,
};

const TimesStops = ({ pathProperties }: TimesStopsProps) => {
  const { t } = useTranslation('timesStops');

  const [timesStopsSteps, setTimesStopsSteps] = useState<Partial<PathWaypointColumn>[] | undefined>(
    undefined
  );

  useEffect(() => {
    // if (!pathProperties) return;
    // const suggestedOPs = formatOPsToSuggestOPs(pathProperties.operational_points);
    const suggestedOPs = formatOPsToSuggestOPs(DATATEST);
    setTimesStopsSteps(suggestedOPs);
  }, [pathProperties]);

  const columns: Column<PathWaypointColumn>[] = useMemo(
    () => [
      {
        ...keyColumn<PathWaypointColumn, 'name'>('name', createTextColumn<string>()),
        title: t('name'),
        disabled: true,
      },
      {
        ...keyColumn<PathWaypointColumn, 'ch'>('ch', createTextColumn()),
        title: 'Ch',
        disabled: true,
        grow: 0.1,
      },
      {
        ...keyColumn<PathWaypointColumn, 'arrival_time'>('arrival_time', timeColumn),
        title: t('arrival_time'),
        grow: 0.6,
      },
      {
        ...keyColumn<PathWaypointColumn, 'departure_time'>('departure_time', timeColumn),
        title: t('departure_time'),
        grow: 0.6,
      },
      {
        ...keyColumn<PathWaypointColumn, 'duration'>(
          'duration',
          createTextColumn<number>({
            continuousUpdates: false,
            alignRight: true,
          })
        ),
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
        ...keyColumn<PathWaypointColumn, 'theoretical_margin'>(
          'theoretical_margin',
          createTextColumn({
            continuousUpdates: false,
            alignRight: true,
            placeholder: t('theoretical_margin_placeholder'),
            formatBlurredInput: (value) => {
              if (!value) return '';
              if (!marginRegExValidation.test(value))
                return `${value}${t('theoretical_margin_placeholder')}`;
              return value;
            },
          })
        ),
        title: t('theoretical_margin'),
        disabled: ({ rowIndex }) => rowIndex === -1,
      },
    ],
    [t, pathProperties]
  );

  return (
    <DataSheetGrid
      columns={columns as Partial<Column<Partial<PathWaypointColumn>, any, any>>[]}
      value={timesStopsSteps}
      onChange={(e, [op]) => {
        console.log('op:', op);
        console.log('e test:', e);
        if (
          e[`${op.fromRowIndex}`].theoretical_margin &&
          !marginRegExValidation.test(e[`${op.fromRowIndex}`].theoretical_margin!)
        ) {
          e[`${op.fromRowIndex}`].isMarginValid = false;
        } else {
          e[`${op.fromRowIndex}`].isMarginValid = true;
        }

        setTimesStopsSteps(e as PathWaypointColumn[]);
      }}
      lockRows
      height={600}
      rowClassName={({ rowData }) =>
        rowData.departure_time || rowData.arrival_time || rowData.duration ? 'activeRow' : ''
      }
      rowKey={({ rowData }) => `${rowData.prId}`}
      cellClassName={({ rowData, columnId }) => {
        if (columnId === 'theoretical_margin' && !(rowData as PathWaypointColumn).isMarginValid)
          return 'invalidCell';
        return '';
      }}
    />
  );
};

export default TimesStops;
