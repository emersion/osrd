import React, { useMemo, useState, useEffect } from 'react';

import type { TFunction } from 'i18next';
import { compact, findLastIndex } from 'lodash';
import {
  keyColumn,
  type Column,
  checkboxColumn,
  createTextColumn,
  DynamicDataSheetGrid,
} from 'react-datasheet-grid';
import { useTranslation } from 'react-i18next';

import type { ManageTrainSchedulePathProperties } from 'applications/operationalStudies/types';
import { useOsrdConfActions } from 'common/osrdContext';
import { isVia } from 'modules/pathfinding/utils';
import type { SuggestedOP } from 'modules/trainschedule/components/ManageTrainSchedule/types';
import type { PathStep } from 'reducers/osrdconf/types';
import { useAppDispatch } from 'store';

import timeColumn from './TimeColomnComponent';

type TimesStopsProps = {
  pathProperties: ManageTrainSchedulePathProperties;
  pathSteps?: (PathStep | null)[];
  setPathProperties: (pathProperties: ManageTrainSchedulePathProperties) => void;
};

type PathWaypointColumn = SuggestedOP & {
  isMarginValid: boolean;
};

const marginRegExValidation = /^\d+(\.\d+)?%$|^\d+(\.\d+)?min\/km$/;

const formatSuggestOPsToRowOPs = (
  operationalPoints: SuggestedOP[],
  t: TFunction<'timesStops', undefined>
): PathWaypointColumn[] => {
  const rowOPs = operationalPoints?.map((op) => ({
    ...op,
    name: op.name || t('waypoint', { id: op.opId }),
    isMarginValid: op.theoreticalMargin ? marginRegExValidation.test(op.theoreticalMargin) : true,
    onStopSignal: op.onStopSignal || false,
  }));
  return rowOPs;
};

const TimesStops = ({ pathProperties, pathSteps = [], setPathProperties }: TimesStopsProps) => {
  const { t } = useTranslation('timesStops');
  const dispatch = useAppDispatch();
  const { upsertViaFromSuggestedOP } = useOsrdConfActions();

  const [timesStopsSteps, setTimesStopsSteps] = useState<PathWaypointColumn[]>([]);

  useEffect(() => {
    const suggestedOPs = formatSuggestOPsToRowOPs(pathProperties.allVias, t);
    setTimesStopsSteps(suggestedOPs);
  }, [pathSteps]);

  const columns: Column<PathWaypointColumn>[] = useMemo(
    () => [
      {
        ...keyColumn<PathWaypointColumn, 'name'>('name', createTextColumn<string | undefined>()),
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
        ...keyColumn<PathWaypointColumn, 'arrival'>('arrival', timeColumn),
        title: t('arrival_time'),
        grow: 0.6,
      },
      {
        ...keyColumn<PathWaypointColumn, 'departure'>('departure', timeColumn),
        title: t('departure_time'),
        grow: 0.6,
      },
      {
        ...keyColumn<PathWaypointColumn, 'stop_for'>(
          'stop_for',
          createTextColumn({
            continuousUpdates: false,
            alignRight: true,
          })
        ),
        title: `${t('stop_time')} (s)`,
      },
      {
        ...keyColumn<PathWaypointColumn, 'onStopSignal'>(
          'onStopSignal',
          checkboxColumn as Partial<Column<boolean | undefined>>
        ),
        title: t('reception_on_closed_signal'),
      },
      {
        ...keyColumn<PathWaypointColumn, 'theoreticalMargin'>(
          'theoreticalMargin',
          createTextColumn({
            continuousUpdates: false,
            alignRight: true,
            placeholder: t('theoretical_margin_placeholder'),
            formatBlurredInput: (value) => {
              if (!value || value === 'none') return '';
              return value;
            },
          })
        ),
        cellClassName: ({ rowData }) => (rowData.isMarginValid ? '' : 'invalidCell'),
        title: t('theoretical_margin'),
        disabled: ({ rowIndex }) => rowIndex === findLastIndex(pathProperties.allVias),
      },
    ],
    [t, pathProperties, timesStopsSteps]
  );

  return (
    <DynamicDataSheetGrid
      columns={columns as Partial<Column<Partial<PathWaypointColumn>>>[]}
      value={timesStopsSteps}
      onChange={(e, [op]) => {
        const rowData = e[`${op.fromRowIndex}`];
        if (rowData.theoreticalMargin && !marginRegExValidation.test(rowData.theoreticalMargin!)) {
          rowData.isMarginValid = false;
        } else {
          rowData.isMarginValid = true;
          dispatch(upsertViaFromSuggestedOP(rowData as SuggestedOP));
          setPathProperties({ ...pathProperties, allVias: e as SuggestedOP[] });
        }
      }}
      lockRows
      height={600}
      rowClassName={({ rowData, rowIndex }) =>
        rowIndex === 0 ||
        rowIndex === findLastIndex(pathProperties.allVias) ||
        isVia(compact(pathSteps), rowData as SuggestedOP)
          ? 'activeRow'
          : ''
      }
    />
  );
};

export default TimesStops;
