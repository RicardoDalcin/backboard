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
import { BASIC_ZONES, ZONE_LOCATIONS } from '@nba-viz/data';

type CourtShotData = Awaited<ReturnType<typeof db.getCourtShotData>>;
type StatSummary = Awaited<ReturnType<typeof db.getStatSummary>>;
type StatsByPlayer = Awaited<ReturnType<typeof db.getStatsByPlayer>>;
type StatsByTeam = Awaited<ReturnType<typeof db.getStatsByTeam>>;

type ParseInt<T> = T extends `${infer N extends number}` ? N : never;

interface StatsStore {
  courtShotData: CourtShotData;
  isLoading: boolean;
  isValidating: boolean;
  statSummary: StatSummary;
  statsByPlayer: StatsByPlayer;
  statsByTeam: StatsByTeam;
  isValidatingStats: boolean;
}

const StatsStoreContext = createContext<StatsStore>({
  // data: [],
  courtShotData: [],
  isLoading: false,
  isValidating: false,
  statSummary: [],
  statsByPlayer: [],
  statsByTeam: [],
  isValidatingStats: false,
});

export function useShots(
  filter: Filter,
  isEnabled = true,
  shouldLoadAuxData = true,
) {
  const filterKey = useMemo(() => JSON.stringify(filter), [filter]);
  const [courtShotData, setCourtShotData] = useState<CourtShotData>([]);
  const [statSummary, setStatSummary] = useState<StatSummary>([]);
  const [statsByPlayer, setStatsByPlayer] = useState<StatsByPlayer>([]);
  const [statsByTeam, setStatsByTeam] = useState<StatsByTeam>([]);

  // const [shots, setShots] = useState<Pick<Shot, T[number]>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
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

        const regionSummary = Object.keys(BASIC_ZONES).map((key) => {
          const locations = ZONE_LOCATIONS[key as keyof typeof ZONE_LOCATIONS];
          const summary = locations.reduce(
            (acc, location) => {
              const shotLocation = data.find(
                (shot) =>
                  shot.locX + 25 === location.x && shot.locY === location.y,
              );

              if (!shotLocation) {
                return acc;
              }

              return {
                totalShots: acc.totalShots + shotLocation.totalShots,
                totalMade: acc.totalMade + shotLocation.totalMade,
              };
            },
            { totalShots: 0, totalMade: 0 },
          );
          return {
            basicZone: Number(key) as ParseInt<keyof typeof BASIC_ZONES>,
            totalShots: summary.totalShots,
            totalMade: summary.totalMade,
          };
        });
        setStatSummary(regionSummary);
      })
      .catch((error) => {
        console.error(error);
      });

    if (shouldLoadAuxData) {
      db.getStatsByPlayer(filter).then((data) => {
        if (signal.aborted) {
          return;
        }

        setStatsByPlayer(data);
      });

      db.getStatsByTeam(filter).then((data) => {
        if (signal.aborted) {
          return;
        }

        setStatsByTeam(data);
      });
    }
  }, [isEnabled, filterKey, lastFilterKey, filter, shouldLoadAuxData]);

  return {
    // data: shots,
    courtShotData,
    isLoading,
    isValidating,
    statSummary,
    statsByPlayer,
    statsByTeam,
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
    statsByPlayer,
    statsByTeam,
    isValidatingStats,
  } = useShots(currentFilter.filters, isEnabled);

  return (
    <StatsStoreContext.Provider
      value={{
        courtShotData,
        isLoading,
        isValidating,
        statSummary,
        statsByPlayer,
        statsByTeam,
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
