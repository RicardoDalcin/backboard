import { atom } from 'jotai';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface ChartSyncStore<T = number | string> {
  getData: (name: string) => T | null;
  updateData: (name: string, index: T | null) => void;
}

const ChartSyncStoreContext = createContext<ChartSyncStore>({
  getData: () => null,
  updateData: () => {},
});

export const ChartSyncProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeDataMap, setActiveDataMap] = useState<
    Map<string, number | string | null>
  >(new Map());

  const getData = useCallback(
    (name: string) => {
      return activeDataMap.get(name) ?? null;
    },
    [activeDataMap],
  );

  const updateData = useCallback(
    (name: string, index: number | string | null) => {
      setActiveDataMap((map) => {
        const data = new Map(map);
        data.set(name, index);
        return data;
      });
    },
    [],
  );

  return (
    <ChartSyncStoreContext.Provider value={{ getData, updateData }}>
      {children}
    </ChartSyncStoreContext.Provider>
  );
};

export const regionSync = atom<string | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useChartSync(name: string) {
  const context = useContext(ChartSyncStoreContext);

  if (context === undefined) {
    throw new Error('useFilters must be used within a ChartSyncProvider');
  }

  const { getData, updateData } = context;

  const activeIndex = useMemo(() => {
    return getData(name);
  }, [getData, name]);

  const setActiveIndex = useCallback(
    (index: number | string | null) => {
      updateData(name, index);
    },
    [updateData, name],
  );

  return { activeIndex, setActiveIndex };
}
