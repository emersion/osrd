import { useState, useEffect } from 'react';

import type { LightRollingStock, LightRollingStockWithLiveries } from 'common/api/osrdEditoastApi';

// text: a string to search in the rolling stock name, detail, reference, series, type, grouping
// elec: true if the rolling stock has an electric mode
// thermal: true if the rolling stock has a thermal mode
// locked: true if the rolling stock is native in the database, can't be updated/deleted
// notLocked: true if the rolling stock is created by the user, can be updated/deleted
export interface Filters {
  text: string;
  elec: boolean;
  thermal: boolean;
  locked: boolean;
  notLocked: boolean;
}

export function rollingStockPassesEnergeticModeFilters(
  modes: LightRollingStock['effort_curves']['modes'],
  { elec, thermal }: Filters
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
  filters: Filters
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

function rollingStockPassesLockedFilter(locked: boolean, filters: Filters) {
  if (filters.locked && !locked) {
    return false;
  }
  return true;
}

function rollingStockPassesNotlockedFilter(locked: boolean, filters: Filters) {
  if (filters.notLocked && locked) {
    return false;
  }
  return true;
}

function filterRollingStocks(rollingStockList: LightRollingStockWithLiveries[], filters: Filters) {
  return rollingStockList?.filter(({ name, metadata, effort_curves: effortCurves, locked }) => {
    const passSearchedStringFilter = rollingStockPassesSearchedStringFilter(
      name,
      metadata,
      filters
    );
    const passEnergeticModesFilter = rollingStockPassesEnergeticModeFilters(
      effortCurves?.modes,
      filters
    );
    const passLockedFilter = rollingStockPassesLockedFilter(locked as boolean, filters);
    const passNotlockedFilter = rollingStockPassesNotlockedFilter(locked as boolean, filters);
    return (
      passSearchedStringFilter &&
      passEnergeticModesFilter &&
      passLockedFilter &&
      passNotlockedFilter
    );
  });
}

type useSearchRollingStockProps = {
  rollingStocks: LightRollingStockWithLiveries[];
  filteredRollingStockList: LightRollingStockWithLiveries[];
  setIsLoading?: (isLoading: boolean) => void;
  isSuccess?: boolean;
  mustResetFilters?: boolean;
  setMustResetFilters?: (mustResetFilters: boolean) => void;
  setFilteredRollingStockList: (rollingStocks: LightRollingStockWithLiveries[]) => void;
};

// TODO: Do we need to migrate the logic of fetch RS from API here too ?
export default function useFilterRollingStock({
  rollingStocks,
  mustResetFilters,
  isSuccess,
  setIsLoading,
  setFilteredRollingStockList,
  setMustResetFilters,
}: useSearchRollingStockProps) {
  const [filters, setFilters] = useState<Filters>({
    text: '',
    elec: false,
    thermal: false,
    locked: false,
    notLocked: false,
  });

  const updateSearch = () => {
    const newFilteredRollingStock = filterRollingStocks(rollingStocks, filters);
    setTimeout(() => {
      setFilteredRollingStockList(newFilteredRollingStock);
      if (setIsLoading) setIsLoading(false);
    }, 0);
  };

  const searchMateriel = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, text: e.target.value.toLowerCase() });
    if (setIsLoading) setIsLoading(true);
  };
  // TODO: investigate if the main condition does not have bad side effects
  const toggleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'notLocked' && filters.locked) {
      setFilters({ ...filters, notLocked: true, locked: false });
    } else if (e.target.name === 'locked' && filters.notLocked) {
      setFilters({ ...filters, locked: true, notLocked: false });
    } else {
      setFilters({
        ...filters,
        [e.target.name]: !filters[e.target.name as 'elec' | 'thermal' | 'locked' | 'notLocked'],
      });
    }
    if (setIsLoading) setIsLoading(true);
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
    const newFilteredRollingStock = filterRollingStocks(rollingStocks, filters);
    setFilteredRollingStockList(newFilteredRollingStock);
  }

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
  }, [filters, rollingStocks]);

  return { filters, setFilters, resetFilters, searchMateriel, toggleFilter };
}
