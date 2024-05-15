import { useState, useEffect, useMemo } from 'react';

import { type SearchResultItemOperationalPoint, osrdEditoastApi } from 'common/api/osrdEditoastApi';
import { useInfraID } from 'common/osrdContext';
import { useDebounce } from 'utils/helpers';

const mainOperationalPointsCHCodes = ['', '00', 'BV'];

export default function useSearchOperationalPoint({
  debounceDelay = 150,
  mainOperationalPointsOnly = false,
}: {
  debounceDelay?: number;
  mainOperationalPointsOnly?: boolean;
}) {
  const infraID = useInfraID();
  const [searchTerm, setSearchTerm] = useState('');
  const [chCodeFilter, setChCodeFilter] = useState('');
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

  const sortedResults = useMemo(
    () =>
      [...searchResults]
        .map((result) => ({
          ...result,
          // remove CH Code information when it's a main operational point (=== "BV" or "00") to ensure it'll be on top of search results
          ch: mainOperationalPointsCHCodes.includes(result.ch) ? '' : result.ch ?? '',
        }))
        // Begin to filter with main operational points (CH code = ''), if not checked, filter on chCode input field
        .filter((result) => {
          if (mainOperationalPointsOnly) return result.ch === '';
          return chCodeFilter !== ''
            ? result.ch.toLocaleLowerCase().includes(chCodeFilter.trim().toLowerCase())
            : true;
        })
        .sort((a, b) => a.name.localeCompare(b.name) || a.ch.localeCompare(b.ch)),
    [searchResults, chCodeFilter, mainOperationalPointsOnly]
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
    searchResults,
    sortedResults,
    setSearchTerm,
    setChCodeFilter,
    setSearchResults,
  };
}
