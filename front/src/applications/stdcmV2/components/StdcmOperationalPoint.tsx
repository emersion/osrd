import React, { useEffect, useState } from 'react';

import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { isNil } from 'lodash';

import type { SearchResultItemOperationalPoint } from 'common/api/osrdEditoastApi';
import SelectSNCF, { type SelectOptionObject } from 'common/BootstrapSNCF/SelectSNCF';
import useSearchOperationalPoint from 'common/Map/Search/useSearchOperationalPoint';
import type { PathStep } from 'reducers/osrdconf/types';
import { useAppDispatch } from 'store';

import StdcmSuggestions from './StdcmSuggestions';

interface StdcmSuggestionsOperationalPointOption extends SelectOptionObject {
  value: SearchResultItemOperationalPoint;
}

type UpdatePointActions =
  | ActionCreatorWithPayload<PathStep | null, 'stdcmConf/updateOriginV2'>
  | ActionCreatorWithPayload<PathStep | null, 'stdcmConf/updateDestinationV2'>;

type StdcmOperationalPointProps = {
  updatePoint: UpdatePointActions;
  point: PathStep | null;
  isPending?: boolean;
};

export default function StdcmOperationalPoint({
  updatePoint,
  point,
  isPending,
}: StdcmOperationalPointProps) {
  const dispatch = useAppDispatch();

  const { searchTerm, chCodeFilter, chOptions, sortedResults, setSearchTerm, setChCodeFilter } =
    useSearchOperationalPoint({ searchTerm: point?.name, chCodeFilter: point?.ch });

  const [selectOptions, setSelectOptions] = useState<string[]>(chOptions);

  const getLabel = ({
    trigram,
    name,
    ci,
    ch,
  }: {
    trigram: string | null;
    ch: string | null;
    ci: string | null;
    name?: string;
  }) => [trigram, name, ci, ch].join(' ');

  useEffect(() => {
    let newSelectOptions = [''];
    if (point?.ch) {
      newSelectOptions = [...newSelectOptions, point.ch];
    } else {
      newSelectOptions = [...newSelectOptions, ...chOptions];
    }
    setSelectOptions(newSelectOptions);
  }, [chOptions, point]);

  useEffect(() => {
    if (point) {
      let trigram = '';
      let ci = '';
      if ('trigram' in point) {
        trigram = point.trigram ?? '';
      }
      if ('secondary_code' in point) {
        ci = point.secondary_code || '';
      }

      setSearchTerm(
        getLabel({
          trigram,
          name: point.name || '',
          ch: point.ch || '',
          ci,
        })
      );
      setChCodeFilter(point.ch || '');
    } else {
      setSearchTerm('');
      setChCodeFilter('');
    }
  }, [point]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('onInputChange', e.target.value);
    setSearchTerm(e.target.value);
    if (e.target.value.trim().length === 0) {
      dispatch(updatePoint(null));
    }
  };

  const dispatchNewPoint = (p?: SearchResultItemOperationalPoint) => {
    if (isNil(p)) {
      dispatch(updatePoint(null));
      return;
    }
    dispatch(
      updatePoint({
        secondary_code: p.ci.toString() ?? null,
        trigram: p.trigram,
        name: p.name,
        ch: p.ch,
        id: p.obj_id,
        coordinates: p.geographic.coordinates,
      })
    );
  };

  const onSelectSuggestion = ({ value }: StdcmSuggestionsOperationalPointOption) => {
    dispatchNewPoint(value);
  };

  const onSelectChCodeFilter = (newchCodeFilter: string = '') => {
    if (newchCodeFilter.trim().length === 0) {
      dispatch(updatePoint(null));
    } else {
      dispatchNewPoint(sortedResults.find((p) => p.ch === newchCodeFilter));
    }
  };

  const operationalPointsSguggestions = sortedResults.map(
    (p: SearchResultItemOperationalPoint) => ({
      value: p,
      label: getLabel({
        trigram: p.trigram,
        name: p.name,
        ch: p.ch,
        ci: p.ci.toString(),
      }),
      ...p,
    })
  );

  return (
    <div className="flex">
      <div className="col-8">
        <StdcmSuggestions
          id="ci"
          label="CI"
          value={searchTerm}
          onChange={onInputChange}
          autoComplete="off"
          options={operationalPointsSguggestions}
          onSelectSuggestion={onSelectSuggestion}
          disabled={isPending}
        />
      </div>

      <div className="w-100 py-2 col-4">
        <SelectSNCF
          label="CH"
          id="ch"
          value={chCodeFilter}
          options={selectOptions}
          onChange={onSelectChCodeFilter}
          disabled={isPending}
        />
      </div>
    </div>
  );
}
