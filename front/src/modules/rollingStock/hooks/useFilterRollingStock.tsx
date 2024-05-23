import { useState, useEffect } from 'react';

import { enhancedEditoastApi } from 'common/api/enhancedEditoastApi';
import type { LightRollingStock, LightRollingStockWithLiveries } from 'common/api/osrdEditoastApi';
import { setFailure } from 'reducers/main';
import { useAppDispatch } from 'store';
import { castErrorToFailure } from 'utils/error';
// text: a string to search in the rolling stock name, detail, reference, series, type, grouping
// elec: true if the rolling stock has an electric mode
// thermal: true if the rolling stock has a thermal mode
// locked: true if the rolling stock is native in the database, can't be updated/deleted
// notLocked: true if the rolling stock is created by the user, can be updated/deleted
export interface RollingStockFilters {
  text: string;
  elec: boolean;
  thermal: boolean;
  locked: boolean;
  notLocked: boolean;
}

export function rollingStockPassesEnergeticModeFilters(
  modes: LightRollingStock['effort_curves']['modes'],
  { elec, thermal }: RollingStockFilters
) {
  if (elec || thermal) {
    const effortCurveModes = Object.values(modes).map(({ is_electric: isElec }) => isElec);
    const hasAnElectricMode = effortCurveModes.includes(true);
    const hasAThermalMode = effortCurveModes.includes(false);
    if ((elec && !hasAnElectricMode) || (thermal && !hasAThermalMode)) {
      return false;
    }
  }
  return true;
}

function rollingStockPassesSearchedStringFilter(
  name: string,
  metadata: LightRollingStock['metadata'],
  filters: RollingStockFilters
) {
  if (!filters.text) {
    return true;
  }
  function includesSearchedString(str: string | undefined) {
    return str && str.toLowerCase().includes(filters.text);
  }
  return [
    name,
    metadata?.detail,
    metadata?.reference,
    metadata?.series,
    metadata?.type,
    metadata?.grouping,
  ].some(includesSearchedString);
}

function rollingStockPassesLockedFilter(locked: boolean, filters: RollingStockFilters) {
  if (filters.locked && !locked) {
    return false;
  }
  return true;
}

function rollingStockPassesNotlockedFilter(locked: boolean, filters: RollingStockFilters) {
  if (filters.notLocked && locked) {
    return false;
  }
  return true;
}

function filterRollingStocks(
  rollingStockList: LightRollingStockWithLiveries[],
  filters: RollingStockFilters
) {
  return rollingStockList.filter(({ name, metadata, effort_curves: effortCurves, locked }) => {
    const passSearchedStringFilter = rollingStockPassesSearchedStringFilter(
      name,
      metadata,
      filters
    );
    const passEnergeticModesFilter = rollingStockPassesEnergeticModeFilters(
      effortCurves.modes,
      filters
    );
    const passLockedFilter = rollingStockPassesLockedFilter(locked, filters);
    const passNotlockedFilter = rollingStockPassesNotlockedFilter(locked, filters);
    return (
      passSearchedStringFilter &&
      passEnergeticModesFilter &&
      passLockedFilter &&
      passNotlockedFilter
    );
  });
}

type useSearchRollingStockProps = {
  mustResetFilters?: boolean;
  setMustResetFilters?: (mustResetFilters: boolean) => void;
};

export default function useFilterRollingStock({
  mustResetFilters,
  setMustResetFilters,
}: useSearchRollingStockProps = {}) {
  const dispatch = useAppDispatch();
  const [filters, setFilters] = useState<RollingStockFilters>({
    text: '',
    elec: false,
    thermal: false,
    locked: false,
    notLocked: false,
  });

  const {
    data: { results: allRollingStocks } = { results: [] },
    isSuccess,
    isError,
    error,
  } = enhancedEditoastApi.endpoints.getLightRollingStock.useQuery({
    pageSize: 1000,
  });

  const [searchIsLoading, setSearchIsLoading] = useState(true);

  const [filteredRollingStockList, setFilteredRollingStockList] =
    useState<LightRollingStockWithLiveries[]>(allRollingStocks);

  const updateSearch = () => {
    const newFilteredRollingStock = filterRollingStocks(allRollingStocks, filters);
    setTimeout(() => {
      setFilteredRollingStockList(newFilteredRollingStock);
      setSearchIsLoading(false);
    }, 0);
  };

  const searchMateriel = (value: string) => {
    setFilters({ ...filters, text: value.toLowerCase() });
    setSearchIsLoading(true);
  };
  // TODO: investigate if the main condition does not have bad side effects
  const toggleFilter = (filter: 'elec' | 'thermal' | 'locked' | 'notLocked') => {
    if (filter === 'notLocked' && filters.locked) {
      setFilters({ ...filters, notLocked: true, locked: false });
    } else if (filter === 'locked' && filters.notLocked) {
      setFilters({ ...filters, locked: true, notLocked: false });
    } else {
      setFilters({
        ...filters,
        [filter]: !filters[filter],
      });
    }
    setSearchIsLoading(true);
  };

  const resetFilters = () => {
    setFilters({
      text: '',
      elec: false,
      thermal: false,
      locked: false,
      notLocked: false,
    });
  };

  function handleRollingStockLoaded() {
    const newFilteredRollingStock = filterRollingStocks(allRollingStocks, filters);
    setFilteredRollingStockList(newFilteredRollingStock);
  }

  useEffect(() => {
    if (isError && error) {
      dispatch(setFailure(castErrorToFailure(error)));
    }
  }, [isError]);

  useEffect(() => {
    handleRollingStockLoaded();
  }, [isSuccess]);

  useEffect(() => {
    if (mustResetFilters && setMustResetFilters) {
      resetFilters();
      setMustResetFilters(false);
    }
  }, [mustResetFilters]);

  useEffect(() => {
    updateSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, allRollingStocks]);

  return {
    allRollingStocks,
    filteredRollingStockList,
    filters,
    searchIsLoading,
    setFilters,
    resetFilters,
    searchMateriel,
    toggleFilter,
  };
}
