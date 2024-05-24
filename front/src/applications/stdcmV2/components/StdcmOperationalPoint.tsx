import React, { useEffect, useState } from 'react';

import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { isNil } from 'lodash';
import { useTranslation } from 'react-i18next';

import type { SearchResultItemOperationalPoint } from 'common/api/osrdEditoastApi';
import SelectSNCF, { type SelectOptionObject } from 'common/BootstrapSNCF/SelectSNCF';
import useSearchOperationalPoint, {
  MAIN_OP_CH_CODES,
} from 'common/Map/Search/useSearchOperationalPoint';
import type { PathStep } from 'reducers/osrdconf/types';
import { useAppDispatch } from 'store';
import { removeDuplicates } from 'utils/array';

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

const StdcmOperationalPoint = ({ updatePoint, point, isPending }: StdcmOperationalPointProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation('stdcm');

  const {
    searchTerm,
    chCodeFilter,
    chOptions,
    searchResults,
    sortedResults,
    setSearchTerm,
    setChCodeFilter,
    setMainOperationalPointsOnly,
  } = useSearchOperationalPoint({ initialSearchTerm: point?.name, initialChCodeFilter: point?.ch });

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
    // let newSelectOptions = ['All'];
    // newSelectOptions = [...newSelectOptions, ...chOptions];
    setSelectOptions(chOptions);
  }, [chOptions, point]);

  useEffect(() => {
    if (point) {
      setSearchTerm(point.name || '');
      setChCodeFilter(point.ch || '');
    } else {
      setChCodeFilter(undefined);
    }
  }, [point]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const onSelectChCodeFilter = (newChCodeFilter?: string = 'All') => {
    console.log('newCodefilter -- ', newChCodeFilter);
    // switch (newchCodeFilter) {
    //   case 'All':
    //     setMainOperationalPointsOnly(false);
    //     setChCodeFilter(undefined);
    //     break;
    //   case 'BV':
    //     setMainOperationalPointsOnly(true);
    //     setChCodeFilter('BV');
    //     break;
    //   default:
    //     setMainOperationalPointsOnly(false);
    //     setChCodeFilter(newchCodeFilter);
    //     break;
    setMainOperationalPointsOnly(MAIN_OP_CH_CODES.includes(newChCodeFilter));
    setChCodeFilter(newChCodeFilter);
    // }
  };
  console.log('sortedResult -- ', sortedResults, searchResults);
  console.log({ chOptions, selectOptions });

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
          label={t('trainPath.ci')}
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
          label={t('trainPath.ch')}
          id="ch"
          value={chCodeFilter}
          options={selectOptions}
          onChange={onSelectChCodeFilter}
          disabled={isPending}
        />
      </div>
    </div>
  );
};

export default StdcmOperationalPoint;
