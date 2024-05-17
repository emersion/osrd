import React, { useEffect } from 'react';

import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';

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

  // console.log('sortedResults -- ', sortedResults);
  // const testChOptions = ['', ...compact(sortedResults.map((result) => result.ch)).sort()];
  console.log('chcode : ', chCodeFilter);
  console.log('testChOptions -- ', chOptions);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      updatePoint(null);
      setChCodeFilter('');
    }
  }, [searchTerm]);

  return (
    <div className="flex">
      <StdcmSuggestions
        id="ci"
        label="CI"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
        options={sortedResults.map((result) => ({
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
      </div>
    </div>
  );
}
