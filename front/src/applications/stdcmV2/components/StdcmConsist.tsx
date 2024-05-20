import React, { useEffect, useState } from 'react';

import { Input } from '@osrd-project/ui-core';
import { useSelector } from 'react-redux';

import { enhancedEditoastApi } from 'common/api/enhancedEditoastApi';
import { type LightRollingStockWithLiveries } from 'common/api/osrdEditoastApi';
import { type SelectOptionObject } from 'common/BootstrapSNCF/SelectSNCF';
import { useOsrdConfActions, useOsrdConfSelectors } from 'common/osrdContext';
import SpeedLimitByTagSelector from 'common/SpeedLimitByTagSelector/SpeedLimitByTagSelector';
import { useStoreDataForSpeedLimitByTagSelector } from 'common/SpeedLimitByTagSelector/useStoreDataForSpeedLimitByTagSelector';
import RollingStock2Img from 'modules/rollingStock/components/RollingStock2Img';
import useFilterRollingStock from 'modules/rollingStock/components/RollingStockCard/useFilterRollingStock';
import type { StdcmConfSliceActions } from 'reducers/osrdconf/stdcmConf';
import type { StdcmConfSelectors } from 'reducers/osrdconf/stdcmConf/selectors';
import { useAppDispatch } from 'store';

import StdcmCard from './StdcmCard';
import StdcmSuggestions from './StdcmSuggestions';

interface StdcmSuggestionsConsistOption
  extends SelectOptionObject,
    Omit<LightRollingStockWithLiveries, 'id'> {
  value: LightRollingStockWithLiveries;
}

function ConsistCardTitle({
  rollingStock,
}: {
  rollingStock?: LightRollingStockWithLiveries | null;
}) {
  if (!rollingStock) return null;

  return (
    <div className="consist-img w-50 d-flex justify-content-end">
      <RollingStock2Img rollingStock={rollingStock} />
    </div>
  );
}

export default function StdcmConsist() {
  const { speedLimitByTag, speedLimitsByTags, dispatchUpdateSpeedLimitByTag } =
    useStoreDataForSpeedLimitByTagSelector();

  const { updateConsist } = useOsrdConfActions() as StdcmConfSliceActions;
  const dispatch = useAppDispatch();

  // TODO: Handle error
  const { data: { results: rollingStocks } = { results: [] }, isSuccess } =
    enhancedEditoastApi.endpoints.getLightRollingStock.useQuery({
      pageSize: 1000,
    });

  const { getConsist } = useOsrdConfSelectors() as StdcmConfSelectors;
  const consist = useSelector(getConsist);
  const selectedRs = rollingStocks.find((rs) => rs.id === consist.tractionEngineId);

  const [filteredRollingStockList, setFilteredRollingStockList] =
    useState<LightRollingStockWithLiveries[]>(rollingStocks);
  const [isSelectChanged, setIsSelectChanged] = useState(false);

  const { filters, searchMateriel } = useFilterRollingStock({
    isSuccess,
    rollingStocks,
    filteredRollingStockList,
    setFilteredRollingStockList,
  });

  const getLabel = (rollingStock: LightRollingStockWithLiveries) => {
    let res = '';
    const { metadata, name } = rollingStock;

    const series = metadata?.series ?? (metadata?.reference || '');
    const subseries =
      metadata?.series && metadata.series !== metadata.subseries
        ? metadata.subseries
        : metadata?.detail || '';

    if (series) res += series;
    if (subseries) res += series ? ` (${subseries})` : subseries;
    if (name) res += ` -- ${name}`;
    return res;
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchMateriel(e.target.value);
  };

  const onInputOnBlur = () => {
    // avoid to set tractionEngineId to null if the onBlur is due to a select change
    if (!isSelectChanged) {
      if (filteredRollingStockList.length === 1) {
        dispatch(
          updateConsist({
            tractionEngineId: filteredRollingStockList[0].id,
          })
        );
      } else {
        dispatch(
          updateConsist({
            tractionEngineId: null,
          })
        );
      }
    }
    setIsSelectChanged(false);
  };

  const onSelectSuggestion = (option: StdcmSuggestionsConsistOption) => {
    dispatch(
      updateConsist({
        tractionEngineId: option.value.id,
      })
    );
    setIsSelectChanged(true);
  };

  useEffect(() => {
    if (selectedRs) {
      searchMateriel(getLabel(selectedRs));
    }
  }, [selectedRs]);

  return (
    <StdcmCard name="Convoi" title={<ConsistCardTitle rollingStock={selectedRs} />}>
      <div className="stdcm-v2-consist">
        <div>
          <StdcmSuggestions
            id="tractionEngine"
            label="Engin de traction"
            value={filters.text.toUpperCase()}
            onChange={onInputChange}
            onBlur={onInputOnBlur}
            options={filteredRollingStockList.map(
              (rs: LightRollingStockWithLiveries) =>
                ({
                  value: rs,
                  label: getLabel(rs),
                  ...rs,
                  id: rs.id.toString(),
                }) as StdcmSuggestionsConsistOption
            )}
            onSelectSuggestion={onSelectSuggestion}
          />
        </div>
        <div className="stdcm-v2-consist__properties">
          <Input id="tonnage" label="Tonnage" trailingContent="t" disabled />
          <Input id="Longueur" label="longueur" trailingContent="m" disabled />
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
