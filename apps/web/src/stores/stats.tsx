import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFilters } from './filters';
import { db, ShotColumn } from '@/server/db';
import { Filter } from '@/types/filters';
import { Shot } from '@/types';
import { useRouterState } from '@tanstack/react-router';

interface StatsStore {
  data: Array<
    Pick<
      Shot,
      | 'locX'
      | 'locY'
      | 'shotMade'
      | 'basicZone'
      | 'shotType'
      | 'quarter'
      | 'minsLeft'
      | 'secsLeft'
    >
  >;
  isLoading: boolean;
  isValidating: boolean;
}

const StatsStoreContext = createContext<StatsStore>({
  data: [],
  isLoading: false,
  isValidating: false,
});

export function useShots<T extends ShotColumn[]>(
  columns: T,
  count: number,
  filter: Filter,
  isEnabled = true,
) {
  const filterKey = useMemo(() => JSON.stringify(filter), [filter]);
  const [shots, setShots] = useState<Pick<Shot, T[number]>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const abortController = useRef(new AbortController());
  const lastFilterKey = useRef('');

  useEffect(() => {
    if (!isEnabled || lastFilterKey.current === filterKey) {
      return;
    }

    lastFilterKey.current = filterKey;
    setIsValidating(true);

    const newAbortController = new AbortController();
    const signal = newAbortController.signal;

    abortController.current.abort();
    abortController.current = newAbortController;

    // const filterChecksum = JSON.stringify(filter)
    //   .split('')
    //   .reduce((acc, filter) => acc + filter.charCodeAt(0), 0);

    db.getShots(columns, count, filter)
      .then((data) => {
        if (signal.aborted) {
          return;
        }
        setIsLoading(false);
        setIsValidating(false);
        setShots(data);
      })
      .catch(() => {});
  }, [isEnabled, filterKey, columns, count, lastFilterKey, filter]);

  return {
    data: shots,
    isLoading,
    isValidating,
  };
}

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentFilter } = useFilters();
  const routerState = useRouterState();

  const { data, isLoading, isValidating } = useShots(
    [
      'locX',
      'locY',
      'shotMade',
      'basicZone',
      'shotType',
      'quarter',
      'minsLeft',
      'secsLeft',
    ],
    1_000_000,
    currentFilter.filters,
    routerState.location.pathname === '/',
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
