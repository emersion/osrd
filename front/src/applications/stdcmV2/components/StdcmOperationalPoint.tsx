import React, { useEffect } from 'react';

import { Select, type SelectProps } from '@osrd-project/ui-core';
import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';

import type { SearchResultItemOperationalPoint } from 'common/api/osrdEditoastApi';
import SelectSNCF from 'common/BootstrapSNCF/SelectSNCF';
import useSearchOperationalPoint from 'common/Map/Search/useSearchOperationalPoint';
import type { PathStep } from 'reducers/osrdconf/types';
import { useAppDispatch } from 'store';

import StdcmSuggestions from './StdcmSuggestions';

type UpdatePointActions =
  | ActionCreatorWithPayload<PathStep | null, 'stdcmConf/updateOriginV2'>
  | ActionCreatorWithPayload<PathStep | null, 'stdcmConf/updateDestinationV2'>;

type StdcmOperationalPointProps = {
  updatePoint: UpdatePointActions;
  point: PathStep | null;
};

export default function StdcmOperationalPoint({ updatePoint, point }: StdcmOperationalPointProps) {
  const dispatch = useAppDispatch();

  const {
    searchTerm,
    chCodeFilter,
    chOptions,
    // searchResults,
    sortedResults,
    setSearchTerm,
    setChCodeFilter,
    // setSearchResults,
  } = useSearchOperationalPoint({ searchTerm: point?.name, chCodeFilter: point?.ch });

  useEffect(() => {
    console.log('chCode changed -->', chCodeFilter);
  }, [chCodeFilter]);

  console.log('chcode : ', chCodeFilter);
  console.log('ChOptions -- ', chOptions);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      updatePoint(null);
      setChCodeFilter('');
    }
  }, [searchTerm]);

  return (
    <div className="flex">
      <div className="col-8">
        <StdcmSuggestions
          id="ci"
          label="CI"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchTerm(e.target.value);
          }}
          options={sortedResults.map((result: SearchResultItemOperationalPoint) => ({
            value: result,
            label: `${result.trigram} ${result.name} ${result.ch} ${result.ci}`,
            ...result,
          }))}
          onSelectSuggestion={(option) => {
            dispatch(
              updatePoint({
                operational_point: option.name,
                name: option.name,
                ch: option.ch,
                id: option.obj_id,
                coordinates: option.geographic.coordinates,
              })
            );
            setSearchTerm(option.name);
            setChCodeFilter(option.ch);
          }}
        />
      </div>

      <div className="w-100 py-3 col-4">
        <SelectSNCF
          sm
          label="CH"
          id="ch"
          value={chCodeFilter}
          options={chOptions}
          onChange={(value) => {
            console.log('value selected : ', value);
            setChCodeFilter(value || '');
          }}
        />
        {/* <Select
          id="ch"
          label="CH"
          value={chCodeFilter}
          options={chOptions}
          onChange={(e) => {
            console.log('value selected : ', e.target.value);
            setChCodeFilter(e.target.value);
          }}
        /> */}
      </div>
    </div>
  );
}
