import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_FILTER, FilterItem } from '@/types/filters';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';

interface FiltersStore {
  filters: FilterItem[];
  currentFilter: FilterItem;
  saveFilter: (filter: FilterItem) => void;
  newFilter: (name: string) => number;
  selectFilter: (id: number) => void;
  deleteFilter: (id: number) => void;
  getShareableUrl: () => string;
}

const FiltersStoreContext = createContext<FiltersStore>({
  filters: [],
  currentFilter: { id: 0, name: '', filters: DEFAULT_FILTER },
  saveFilter: () => {},
  newFilter: () => -1,
  selectFilter: () => {},
  deleteFilter: () => {},
  getShareableUrl: () => '',
});

export const FiltersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const DEFAULT_FILTER_ID = 1;

  const { t } = useTranslation();
  const [filters, setFilters] = useLocalStorage<FilterItem[]>(
    'backboard.filters',
    [
      {
        id: DEFAULT_FILTER_ID,
        name: t('filters.newFilter'),
        filters: DEFAULT_FILTER,
      },
    ],
    (value) => value.length >= 1,
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
        const newFilters = [...filters];
        const index = newFilters.findIndex((f) => f.id === newFilter.id);
        if (index === -1) {
          newFilters.push(newFilter);
        } else {
          newFilters[index] = newFilter;
        }
        return newFilters;
      });
    },
    [setFilters],
  );

  const newFilter = useCallback(
    (name: string) => {
      let newId = -1;

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

        newId = newFilter.id;

        return [...filters, newFilter];
      });

      return newId;
    },
    [setFilters],
  );

  const selectFilter = useCallback(
    (id: number) => {
      setCurrentFilterId(id);
    },
    [setCurrentFilterId],
  );

  const deleteFilter = useCallback(
    (id: number) => {
      setFilters((filters) => {
        return filters.filter((f) => f.id !== id);
      });

      if (currentFilter.id === id) {
        selectFilter(filters.find((f) => f.id !== id)?.id ?? 0);
      }
    },
    [currentFilter.id, filters, selectFilter, setFilters],
  );

  const getShareableUrl = useCallback(() => {
    const filter = {
      name: currentFilter.name,
      filters: currentFilter.filters,
    };
    const stringifiedFilter = JSON.stringify(filter);
    const base64Filter = btoa(stringifiedFilter);
    return `${window.location.origin}?filter=${base64Filter}`;
  }, [currentFilter]);

  useEffect(() => {
    const sharedFilter = window.localStorage.getItem('backboard.sharedFilter');
    if (sharedFilter) {
      const decodedFilter = atob(sharedFilter);
      const filterObject = JSON.parse(decodedFilter);
      const id = newFilter(filterObject.name);
      saveFilter({
        id,
        name: filterObject.name,
        filters: filterObject.filters,
      });
      selectFilter(id);
      window.localStorage.removeItem('backboard.sharedFilter');
    }
  }, [newFilter, saveFilter, selectFilter]);

  return (
    <FiltersStoreContext.Provider
      value={{
        filters,
        currentFilter,
        saveFilter,
        newFilter,
        selectFilter,
        deleteFilter,
        getShareableUrl,
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
