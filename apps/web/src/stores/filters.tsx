import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_FILTER, FilterItem } from '@/types/filters';
import { createContext, useCallback, useContext, useMemo } from 'react';

interface FiltersStore {
  filters: FilterItem[];
  currentFilter: FilterItem;
  saveFilter: (filter: FilterItem) => void;
  newFilter: (name: string) => void;
  selectFilter: (id: number) => void;
}

const FiltersStoreContext = createContext<FiltersStore>({
  filters: [],
  currentFilter: { id: 0, name: '', filters: DEFAULT_FILTER },
  saveFilter: () => {},
  newFilter: () => {},
  selectFilter: () => {},
});

export const FiltersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const DEFAULT_FILTER_ID = 1;

  const [filters, setFilters] = useLocalStorage<FilterItem[]>(
    'backboard.filters',
    [
      {
        id: DEFAULT_FILTER_ID,
        name: 'New filter',
        filters: DEFAULT_FILTER,
      },
      {
        id: DEFAULT_FILTER_ID + 1,
        name: 'Dallas Mavericks',
        filters: { ...DEFAULT_FILTER, teams: [1610612737] },
      },
      {
        id: DEFAULT_FILTER_ID + 2,
        name: 'Def vs. Off',
        filters: {
          ...DEFAULT_FILTER,
          defensiveRatingRank: [1, 10],
          offensiveRatingRank: [20, 30],
        },
      },
    ],
  );

  const [currentFilterId, setCurrentFilterId] = useLocalStorage(
    'backboard.currentFilter',
    DEFAULT_FILTER_ID,
  );

  const currentFilter = useMemo(() => {
    const filter = filters.find((f) => f.id === currentFilterId);

    if (!filter) {
      throw new Error('Filter not found');
    }

    return filter;
  }, [currentFilterId, filters]);

  const saveFilter = useCallback(
    (newFilter: FilterItem) => {
      setFilters((filters) => {
        const index = filters.findIndex((f) => f.id === newFilter.id);
        if (index === -1) {
          filters.push(newFilter);
        } else {
          filters[index] = newFilter;
        }
        return filters;
      });
    },
    [setFilters],
  );

  const newFilter = useCallback(
    (name: string) => {
      setFilters((filters) => {
        const maxId = filters.reduce(
          (maxId, filter) => Math.max(maxId, filter.id),
          0,
        );

        const newFilter = {
          id: maxId + 1,
          name,
          filters: DEFAULT_FILTER,
        };

        return [...filters, newFilter];
      });
    },
    [setFilters],
  );

  const selectFilter = useCallback(
    (id: number) => {
      setCurrentFilterId(id);
    },
    [setCurrentFilterId],
  );

  return (
    <FiltersStoreContext.Provider
      value={{
        filters,
        currentFilter,
        saveFilter,
        newFilter,
        selectFilter,
      }}
    >
      {children}
    </FiltersStoreContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useFilters() {
  const context = useContext(FiltersStoreContext);

  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }

  return context;
}
