import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Form, FormField } from '@/components/ui/form';
import { Court } from '@/components/viz/court';
import { ShotRegionChart } from '@/components/viz/shot-region-chart';
import { cn } from '@/lib/utils';
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
  canRemovePanel,
  onClosePanel,
  className = '',
}: {
  filter: FilterItem;
  onChangeFilter: (id: number) => void;
  canRemovePanel: boolean;
  onClosePanel: () => void;
  className?: string;
}) => {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { filterId: filter.id },
  });

  const { courtShotData, statSummary } = useShots(filter.filters, true, false);

  const { filters } = useFilters();

  const filterOptions = useMemo(
    () => filters.map((item) => ({ label: item.name, value: item.id })),
    [filters],
  );

  return (
    <div
      className={cn(
        '@container h-full max-w-full flex flex-col items-center px-4 py-4 gap-6',
        className,
      )}
    >
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

        {canRemovePanel && (
          <Button
            variant="outline"
            className="!aspect-square !px-0"
            onClick={onClosePanel}
          >
            <XMarkIcon className="size-4" />
          </Button>
        )}
      </div>

      <Court data={courtShotData} filter={filter.filters} />

      <ShotRegionChart data={statSummary} />
    </div>
  );
};
