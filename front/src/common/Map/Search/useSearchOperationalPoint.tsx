import { useState, useEffect, useMemo } from 'react';

import { compact } from 'lodash';

import { type SearchResultItemOperationalPoint, osrdEditoastApi } from 'common/api/osrdEditoastApi';
import { useInfraID } from 'common/osrdContext';
import { useDebounce } from 'utils/helpers';

export const mainOperationalPointsCHCodes = ['', '00', 'BV'];

type SearchOperationalPoint = {
  debounceDelay?: number;
  mainOperationalPointsOnly?: boolean;
  searchTerm?: string;
  chCodeFilter?: string;
};

export default function useSearchOperationalPoint(props?: SearchOperationalPoint) {
  const {
    debounceDelay = 150,
    mainOperationalPointsOnly = false,
    searchTerm: initialSearchTerm = '',
    chCodeFilter: initialChCodeFilter = '',
  } = props || {};
  const infraID = useInfraID();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [chCodeFilter, setChCodeFilter] = useState(initialChCodeFilter);
  const [searchResults, setSearchResults] = useState<SearchResultItemOperationalPoint[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);
  const [postSearch] = osrdEditoastApi.endpoints.postSearch.useMutation();

  const searchOperationalPoints = async () => {
    const isSearchingByTrigram = !Number.isInteger(+debouncedSearchTerm) && searchTerm.length < 4;
    const searchQuery = isSearchingByTrigram
      ? // We have to test for op names that goes under 4 letters too
        ['or', ['=i', ['trigram'], debouncedSearchTerm], ['=i', ['name'], debouncedSearchTerm]]
      : [
          'or',
          ['search', ['name'], debouncedSearchTerm],
          ['like', ['to_string', ['uic']], `%${debouncedSearchTerm}%`],
        ];
    const payload = {
      object: 'operationalpoint',
      query: ['and', searchQuery, infraID !== undefined ? ['=', ['infra_id'], infraID] : true],
    };

    try {
      const results = await postSearch({
        searchPayload: payload,
        pageSize: 101,
      }).unwrap();
      setSearchResults(results as SearchResultItemOperationalPoint[]);
    } catch (error) {
      setSearchResults([]);
    }
  };

  const sortedResults = useMemo(() => {
    const filterResults = (result: SearchResultItemOperationalPoint) => {
      const shouldInclude =
        chCodeFilter !== ''
          ? result.ch.toLocaleLowerCase().includes(chCodeFilter.trim().toLowerCase())
          : true;
      return shouldInclude;
    };

    const sortResults = (results: SearchResultItemOperationalPoint[]) =>
      results.sort((a, b) => a.name.localeCompare(b.name) || a.ch?.localeCompare(b.ch));

    const mainOperationalPoints: SearchResultItemOperationalPoint[] = [];
    const otherPoints: SearchResultItemOperationalPoint[] = [];

    searchResults.forEach((result) => {
      if (filterResults(result)) {
        if (mainOperationalPointsCHCodes.includes(result.ch)) {
          mainOperationalPoints.push(result);
        } else {
          otherPoints.push(result);
        }
      }
    });

    const sortedMainOperationalPoints = sortResults(mainOperationalPoints);
    const sortedOtherPoints = sortResults(otherPoints);

    if (mainOperationalPointsOnly) return sortedMainOperationalPoints;

    return [...sortedMainOperationalPoints, ...sortedOtherPoints];
  }, [searchResults, chCodeFilter, mainOperationalPointsOnly]);

  const chOptions = useMemo(
    () => [...compact(sortedResults.sort().map((result) => result.ch))],
    [searchResults]
  );

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchOperationalPoints();
    } else if (searchResults.length !== 0) {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  return {
    searchTerm,
    chCodeFilter,
    chOptions,
    searchResults,
    sortedResults,
    setSearchTerm,
    setChCodeFilter,
    setSearchResults,
  };
}
