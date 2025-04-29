import { createContext, useContext, useEffect, useMemo } from 'react';
import { useFilters } from './filters';
import { db, ShotColumn } from '@/server/db';
import { Filter } from '@/types/filters';
import useSWR from 'swr';
import { Shot } from '@/types';

interface StatsStore {
  data: Array<Pick<Shot, 'locX' | 'locY' | 'shotMade'>>;
  isLoading: boolean;
  isValidating: boolean;
}

const StatsStoreContext = createContext<StatsStore>({
  data: [],
  isLoading: false,
  isValidating: false,
});

function useShots<T extends ShotColumn[]>(
  columns: T,
  count: number,
  filter: Filter,
) {
  const filterKey = useMemo(() => JSON.stringify(filter), [filter]);

  const { data, isLoading, isValidating, mutate } = useSWR(`/api/shots`, () => {
    return db.getShots(columns, count, {
      teamIds: filter.teams,
      playerIds: filter.players,
      season: filter.season,
      drtgRanking: filter.defensiveRatingRank,
      ortgRanking: filter.offensiveRatingRank,
      positions: filter.positions,
      result: filter.result,
    });
  });

  useEffect(() => {
    mutate();
  }, [filterKey, mutate]);

  return {
    data,
    isLoading,
    isValidating,
  };
}

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentFilter } = useFilters();

  const { data, isLoading, isValidating } = useShots(
    ['locX', 'locY', 'shotMade'],
    1_000_000,
    currentFilter.filters,
  );

  const dataList = useMemo(() => data ?? [], [data]);

  return (
    <StatsStoreContext.Provider
      value={{ data: dataList, isLoading, isValidating }}
    >
      {children}
    </StatsStoreContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useStats() {
  const context = useContext(StatsStoreContext);

  if (context === undefined) {
    throw new Error('useStats must be used within a FiltersProvider');
  }

  return context;
}
