import React, { useEffect, useState } from 'react';

// import { Input } from '@osrd-project/ui-core';

import { type LightRollingStockWithLiveries } from 'common/api/osrdEditoastApi';
import { type SelectOptionObject } from 'common/BootstrapSNCF/SelectSNCF';
import { useOsrdConfActions } from 'common/osrdContext';
import SpeedLimitByTagSelector from 'common/SpeedLimitByTagSelector/SpeedLimitByTagSelector';
import { useStoreDataForSpeedLimitByTagSelector } from 'common/SpeedLimitByTagSelector/useStoreDataForSpeedLimitByTagSelector';
import RollingStock2Img from 'modules/rollingStock/components/RollingStock2Img';
import { useStoreDataForRollingStockSelector } from 'modules/rollingStock/components/RollingStockSelector/useStoreDataForRollingStockSelector';
import useFilterRollingStock from 'modules/rollingStock/hooks/useFilterRollingStock';
import type { StdcmConfSliceActions } from 'reducers/osrdconf/stdcmConf';
import { useAppDispatch } from 'store';

import StdcmCard from './StdcmCard';
import StdcmSuggestions from './StdcmSuggestions';

interface StdcmSuggestionsConsistOption
  extends SelectOptionObject,
    Omit<LightRollingStockWithLiveries, 'id'> {
  value: LightRollingStockWithLiveries;
}

const ConsistCardTitle = ({
  rollingStock,
}: {
  rollingStock?: LightRollingStockWithLiveries | null;
}) => {
  if (!rollingStock) return null;

  return (
    <div className="stdcm-v2-consist-img w-75 d-flex justify-content-end">
      <RollingStock2Img rollingStock={rollingStock} />
    </div>
  );
};

const StdcmConsist = ({ isPending = false }: { isPending?: boolean }) => {
  const { speedLimitByTag, speedLimitsByTags, dispatchUpdateSpeedLimitByTag } =
    useStoreDataForSpeedLimitByTagSelector();

  const { updateRollingStockID } = useOsrdConfActions() as StdcmConfSliceActions;
  const dispatch = useAppDispatch();

  const { rollingStock } = useStoreDataForRollingStockSelector();

  const [isSelectChanged, setIsSelectChanged] = useState(false);

  const { filters, searchMateriel, filteredRollingStockList } = useFilterRollingStock();

  const getLabel = (rs: LightRollingStockWithLiveries) => {
    let res = '';
    const { metadata, name } = rs;

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
        dispatch(updateRollingStockID(filteredRollingStockList[0].id));
      } else {
        dispatch(updateRollingStockID(undefined));
      }
    }
    setIsSelectChanged(false);
  };

  const onSelectSuggestion = (option: StdcmSuggestionsConsistOption) => {
    dispatch(updateRollingStockID(option.value.id));
    setIsSelectChanged(true);
  };

  useEffect(() => {
    if (rollingStock) {
      searchMateriel(getLabel(rollingStock));
    }
  }, [rollingStock]);

  return (
    <StdcmCard
      name="Convoi"
      title={<ConsistCardTitle rollingStock={rollingStock} />}
      disabled={isPending}
    >
      <div className="stdcm-v2-consist">
        <div>
          <StdcmSuggestions
            id="tractionEngine"
            label="Engin de traction"
            value={filters.text.toUpperCase()}
            onChange={onInputChange}
            autoComplete="off"
            onBlur={onInputOnBlur}
            disabled={isPending}
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
        {/* <div className="stdcm-v2-consist__properties d-flex justify-content-between">
          <Input id="tonnage" label="Tonnage" trailingContent="t" disabled />
          <Input id="Longueur" label="longueur" trailingContent="m" disabled />
        </div> */}
        <p className="stdcm-v2-consist__title">Limitation de vitesse</p>
        <SpeedLimitByTagSelector
          disabled={isPending}
          selectedSpeedLimitByTag={speedLimitByTag}
          speedLimitsByTags={speedLimitsByTags}
          dispatchUpdateSpeedLimitByTag={dispatchUpdateSpeedLimitByTag}
        />
      </div>
    </StdcmCard>
  );
};

export default StdcmConsist;
