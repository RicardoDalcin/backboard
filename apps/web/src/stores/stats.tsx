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

type CourtShotData = Awaited<ReturnType<typeof db.getCourtShotData>>;
type StatSummary = Awaited<ReturnType<typeof db.getStatSummary>>;

interface StatsStore {
  courtShotData: CourtShotData;
  isLoading: boolean;
  isValidating: boolean;
  statSummary: StatSummary;
  isLoadingStats: boolean;
  isValidatingStats: boolean;
}

const StatsStoreContext = createContext<StatsStore>({
  // data: [],
  courtShotData: [],
  isLoading: false,
  isValidating: false,
  statSummary: [],
  isLoadingStats: false,
  isValidatingStats: false,
});

export function useShots(filter: Filter, isEnabled = true) {
  const filterKey = useMemo(() => JSON.stringify(filter), [filter]);
  const [courtShotData, setCourtShotData] = useState<CourtShotData>([]);
  const [statSummary, setStatSummary] = useState<StatSummary>([]);

  // const [shots, setShots] = useState<Pick<Shot, T[number]>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isValidatingStats, setIsValidatingStats] = useState(false);

  const abortController = useRef(new AbortController());
  const lastFilterKey = useRef('');

  useEffect(() => {
    if (!isEnabled || lastFilterKey.current === filterKey) {
      return;
    }

    lastFilterKey.current = filterKey;
    setIsValidating(true);
    setIsValidatingStats(true);

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

    db.getStatSummary(filter).then((data) => {
      if (signal.aborted) {
        return;
      }

      setIsLoadingStats(false);
      setIsValidatingStats(false);
      setStatSummary(data);
    });
  }, [isEnabled, filterKey, lastFilterKey, filter]);

  return {
    // data: shots,
    courtShotData,
    isLoading,
    isValidating,
    statSummary,
    isLoadingStats,
    isValidatingStats,
  };
}

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentFilter } = useFilters();
  const { isEnabled } = useRouterState({
    select: (state) => ({
      isEnabled: state.location.pathname === '/' && state.status !== 'pending',
    }),
  });

  const {
    courtShotData,
    isLoading,
    isValidating,
    statSummary,
    isLoadingStats,
    isValidatingStats,
  } = useShots(currentFilter.filters, isEnabled);

  return (
    <StatsStoreContext.Provider
      value={{
        courtShotData,
        isLoading,
        isValidating,
        statSummary,
        isLoadingStats,
        isValidatingStats,
      }}
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
