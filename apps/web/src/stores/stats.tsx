import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFilters } from './filters';
import { db } from '@/server/db';
import { Filter } from '@/types/filters';
import { useRouterState } from '@tanstack/react-router';

interface StatsStore {
  courtShotData: {
    locX: number;
    locY: number;
    totalShots: number;
    totalMade: number;
  }[];
  isLoading: boolean;
  isValidating: boolean;
}

const StatsStoreContext = createContext<StatsStore>({
  // data: [],
  courtShotData: [],
  isLoading: false,
  isValidating: false,
});

export function useShots(filter: Filter, isEnabled = true) {
  const filterKey = useMemo(() => JSON.stringify(filter), [filter]);
  const [courtShotData, setCourtShotData] = useState<
    { locX: number; locY: number; totalShots: number; totalMade: number }[]
  >([]);
  // const [shots, setShots] = useState<Pick<Shot, T[number]>[]>([]);
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

    db.getCourtShotData(filter)
      .then((data) => {
        if (signal.aborted) {
          return;
        }
        setIsLoading(false);
        setIsValidating(false);
        setCourtShotData(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [isEnabled, filterKey, lastFilterKey, filter]);

  return {
    // data: shots,
    courtShotData,
    isLoading,
    isValidating,
  };
}

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentFilter } = useFilters();
  const routerState = useRouterState();

  const { courtShotData, isLoading, isValidating } = useShots(
    currentFilter.filters,
    routerState.location.pathname === '/',
  );

  return (
    <StatsStoreContext.Provider
      value={{ courtShotData, isLoading, isValidating }}
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
