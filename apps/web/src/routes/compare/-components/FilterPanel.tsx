import { Court } from '@/components/viz/court';
import { useShots } from '@/stores/stats';
import { FilterItem } from '@/types/filters';
import { useMemo } from 'react';

export const FilterPanel = ({ filter }: { filter: FilterItem }) => {
  const { data, isLoading, isValidating } = useShots(
    ['locX', 'locY', 'shotMade'],
    1_000,
    filter.filters,
  );

  const shots = useMemo(() => data ?? [], [data]);

  return (
    <div className="h-full flex flex-col items-center px-4 py-4">
      <p>Hello filter {filter.name}</p>
      {isLoading && <p>Loading shots...</p>}
      {isValidating && <p>Validating shots...</p>}
      {shots.length > 0 && <p>Shots: {shots.length}</p>}
      <Court shots={shots} />
    </div>
  );
};
