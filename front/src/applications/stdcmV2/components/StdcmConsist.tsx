import React, { useState } from 'react';

import { Input } from '@osrd-project/ui-core';

import { enhancedEditoastApi } from 'common/api/enhancedEditoastApi';
import { type LightRollingStockWithLiveries } from 'common/api/osrdEditoastApi';
import { SelectOptionObject } from 'common/BootstrapSNCF/SelectImprovedSNCF';
import SpeedLimitByTagSelector from 'common/SpeedLimitByTagSelector/SpeedLimitByTagSelector';
import { useStoreDataForSpeedLimitByTagSelector } from 'common/SpeedLimitByTagSelector/useStoreDataForSpeedLimitByTagSelector';
import useFilterRollingStock from 'modules/rollingStock/components/RollingStockCard/useFilterRollingStock';

import StdcmCard from './StdcmCard';
import StdcmSuggestions from './StdcmSuggestions';

export default function StdcmConsist() {
  const { speedLimitByTag, speedLimitsByTags, dispatchUpdateSpeedLimitByTag } =
    useStoreDataForSpeedLimitByTagSelector();

  // TODO: Handle error
  const {
    data: { results: rollingStocks } = { results: [] },
    isSuccess,
    isError,
    error,
  } = enhancedEditoastApi.endpoints.getLightRollingStock.useQuery({
    pageSize: 1000,
  });

  const [filteredRollingStockList, setFilteredRollingStockList] =
    useState<LightRollingStockWithLiveries[]>(rollingStocks);

  const { filters, searchMateriel } = useFilterRollingStock({
    rollingStocks,
    filteredRollingStockList,
    setFilteredRollingStockList,
  });

  return (
    <StdcmCard name="Convoi">
      <div className="stdcm-v2-consist">
        <div>
          <StdcmSuggestions
            id="tractionEngine"
            label="Engin de traction"
            onChange={(e) => {
              searchMateriel(e);
            }}
            options={filteredRollingStockList.map((rs) => ({
              value: rs,
              label: `${rs.metadata?.series ?? rs.metadata?.reference}` || '',
              ...rs,
            }))}
            onSelectSuggestion={(option) => {}}
          />
        </div>
        <div className="stdcm-v2-consist__properties">
          <Input id="tonnage" label="Tonnage" trailingContent="t" />
          <Input id="Longueur" label="longueur" trailingContent="m" />
        </div>
        <SpeedLimitByTagSelector
          selectedSpeedLimitByTag={speedLimitByTag}
          speedLimitsByTags={speedLimitsByTags}
          dispatchUpdateSpeedLimitByTag={dispatchUpdateSpeedLimitByTag}
        />
      </div>
    </StdcmCard>
  );
}
