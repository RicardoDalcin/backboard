import { Combobox } from '@/components/ui/combobox';
import { Form, FormField } from '@/components/ui/form';
import { Court } from '@/components/viz/court';
import { useFilters } from '@/stores/filters';
import { useShots } from '@/stores/stats';
import { FilterItem } from '@/types/filters';
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
}: {
  filter: FilterItem;
  onChangeFilter: (id: number) => void;
}) => {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { filterId: filter.id },
  });

  const { data } = useShots(
    ['locX', 'locY', 'shotMade'],
    1_000_000,
    filter.filters,
  );

  const { filters } = useFilters();

  const filterOptions = useMemo(
    () => filters.map((item) => ({ label: item.name, value: item.id })),
    [filters],
  );

  const shots = useMemo(() => data ?? [], [data]);

  return (
    <div className="h-full max-w-full flex flex-col items-center px-4 py-4 gap-6">
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

      <Court shots={shots} />
    </div>
  );
};
