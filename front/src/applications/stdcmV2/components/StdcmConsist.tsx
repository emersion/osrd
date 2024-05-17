import React, { useEffect, useState } from 'react';

import { Input } from '@osrd-project/ui-core';
import { isNull } from 'lodash';
import { useSelector } from 'react-redux';

import { enhancedEditoastApi } from 'common/api/enhancedEditoastApi';
import { type LightRollingStockWithLiveries } from 'common/api/osrdEditoastApi';
import { useOsrdConfActions, useOsrdConfSelectors } from 'common/osrdContext';
import SpeedLimitByTagSelector from 'common/SpeedLimitByTagSelector/SpeedLimitByTagSelector';
import { useStoreDataForSpeedLimitByTagSelector } from 'common/SpeedLimitByTagSelector/useStoreDataForSpeedLimitByTagSelector';
import useFilterRollingStock from 'modules/rollingStock/components/RollingStockCard/useFilterRollingStock';
import type { StdcmConfSliceActions } from 'reducers/osrdconf/stdcmConf';
import type { StdcmConfSelectors } from 'reducers/osrdconf/stdcmConf/selectors';
import { useAppDispatch } from 'store';

import StdcmCard from './StdcmCard';
import StdcmSuggestions from './StdcmSuggestions';

export default function StdcmConsist() {
  const { speedLimitByTag, speedLimitsByTags, dispatchUpdateSpeedLimitByTag } =
    useStoreDataForSpeedLimitByTagSelector();

  console.log('speedLimitByTag', speedLimitByTag, speedLimitsByTags);

  const { updateConsist } = useOsrdConfActions() as StdcmConfSliceActions;
  const dispatch = useAppDispatch();

  // TODO: Handle error
  const {
    data: { results: rollingStocks } = { results: [] },
    isSuccess,
    isError,
    error,
  } = enhancedEditoastApi.endpoints.getLightRollingStock.useQuery({
    pageSize: 1000,
  });

  const { getConsist } = useOsrdConfSelectors() as StdcmConfSelectors;
  const consist = useSelector(getConsist);

  const [currentRs, setCurrentRs] = useState<LightRollingStockWithLiveries | null>(null);

  const [filteredRollingStockList, setFilteredRollingStockList] =
    useState<LightRollingStockWithLiveries[]>(rollingStocks);

  const { filters, searchMateriel } = useFilterRollingStock({
    isSuccess,
    rollingStocks,
    filteredRollingStockList,
    setFilteredRollingStockList,
  });

  useEffect(() => {
    if (!isNull(consist)) {
      searchMateriel(consist.tractionEngineName || '');
    }
  }, [consist]);

  return (
    <StdcmCard name="Convoi" imageSource={currentRs || undefined}>
      <div className="stdcm-v2-consist">
        <div>
          <StdcmSuggestions
            id="tractionEngine"
            label="Engin de traction"
            value={filters.text.toUpperCase()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              searchMateriel(e.target.value);
            }}
            options={filteredRollingStockList.map((rs: LightRollingStockWithLiveries) => {
              const label = `${rs.name} - ${rs.metadata?.series}`;

              return {
                value: rs,
                label,
                ...rs,
                id: rs.id.toString(),
              };
            })}
            onSelectSuggestion={(option) => {
              setCurrentRs(option.value);
              dispatch(
                updateConsist({
                  tractionEngineId: option.value.id,
                  tractionEngineName: option.value.name,
                })
              );
            }}
          />
        </div>
        <div className="stdcm-v2-consist__properties">
          <Input id="tonnage" label="Tonnage" trailingContent="t" />
          <Input id="Longueur" label="longueur" trailingContent="m" />
        </div>
        <p className="stdcm-v2-consist__title">Limitation de vitesse</p>
        <SpeedLimitByTagSelector
          selectedSpeedLimitByTag={speedLimitByTag}
          speedLimitsByTags={speedLimitsByTags}
          dispatchUpdateSpeedLimitByTag={dispatchUpdateSpeedLimitByTag}
        />
      </div>
    </StdcmCard>
  );
}
