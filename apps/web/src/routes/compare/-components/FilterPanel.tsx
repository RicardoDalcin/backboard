import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Form, FormField } from '@/components/ui/form';
import { ClockAreaChart } from '@/components/viz/clock-area-chart';
import { Court } from '@/components/viz/court';
import { ShotTypeLineChart } from '@/components/viz/shot-type-line-chart';
import { useClockSummary } from '@/components/viz/useClockSummary';
import { useShotTypeSummary } from '@/components/viz/useShotTypeSummary';
import { useFilters } from '@/stores/filters';
import { useShots } from '@/stores/stats';
import { FilterItem } from '@/types/filters';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  filterId: z.number(),
});

export const FilterPanel = ({
  filter,
  onChangeFilter,
  hoveredSection,
  onChangeHoveredSection,
  onClosePanel,
}: {
  filter: FilterItem;
  onChangeFilter: (id: number) => void;
  hoveredSection: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null;
  onChangeHoveredSection: (
    section: {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    } | null,
  ) => void;
  onClosePanel: () => void;
}) => {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { filterId: filter.id },
  });

  const { data } = useShots(
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
    filter.filters,
  );

  const { filters } = useFilters();

  const filterOptions = useMemo(
    () => filters.map((item) => ({ label: item.name, value: item.id })),
    [filters],
  );

  const shots = useMemo(() => data ?? [], [data]);

  const { clockSummary } = useClockSummary(data);
  const { shotTypeSummary } = useShotTypeSummary(data);

  return (
    <div className="h-full max-w-full flex flex-col items-center px-4 py-4 gap-6">
      <div className="flex items-center gap-2 w-full">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="w-full">
            <FormField
              control={form.control}
              name="filterId"
              render={({ field }) => (
                <Combobox
                  {...field}
                  onSelect={(value) => {
                    form.setValue('filterId', value);
                    onChangeFilter(value);
                  }}
                  options={filterOptions}
                  className="w-full"
                />
              )}
            />
          </form>
        </Form>

        <Button
          variant="outline"
          className="!aspect-square !px-0"
          onClick={onClosePanel}
        >
          <XMarkIcon className="size-4" />
        </Button>
      </div>

      <Court
        shots={shots}
        onChangeHoveredSection={onChangeHoveredSection}
        hoveredSection={hoveredSection}
      />

      <ClockAreaChart data={clockSummary} />

      <ShotTypeLineChart data={shotTypeSummary} />
    </div>
  );
};
