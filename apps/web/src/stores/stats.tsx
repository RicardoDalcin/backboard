import { createContext, useContext, useMemo } from 'react';
import { useFilters } from './filters';
import { db, ShotColumn } from '@/server/db';
import { Filter } from '@/types/filters';
import useSWR from 'swr';
import { Shot } from '@/types';

interface StatsStore {
  data: Array<Pick<Shot, 'locX' | 'locY' | 'shotMade'>>;
  isLoading: boolean;
}

const StatsStoreContext = createContext<StatsStore>({
  data: [],
  isLoading: false,
});

function useShots<T extends ShotColumn[]>(
  columns: T,
  count: number,
  filter: Filter,
) {
  const { data, isLoading } = useSWR('/api/shots', () => {
    return db.getShots(columns, count, {
      teamId: filter.teams[0],
      playerId: filter.players[0],
      season: filter.season,
    });
  });

  return {
    data,
    isLoading,
  };
}

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentFilter } = useFilters();

  const { data, isLoading } = useShots(
    ['locX', 'locY', 'shotMade'],
    1_000,
    currentFilter.filters,
  );

  const dataList = useMemo(() => data ?? [], [data]);

  return (
    <StatsStoreContext.Provider value={{ data: dataList, isLoading }}>
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
