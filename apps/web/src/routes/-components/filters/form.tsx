import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { MultiCombobox } from '@/components/ui/multi-combobox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RangeSlider } from '@/components/ui/range-slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { POSITIONS, RESULTS, SEASONS, TEAMS, Filter } from '@/types/filters';
import { useFilters } from '@/stores/filters';
import { useEffect } from 'react';

const schema = z.object({
  season: z.number().min(4).max(24),
  defensiveRatingRank: z.tuple([
    z.number().min(1).max(30),
    z.number().min(1).max(30),
  ]),
  offensiveRatingRank: z.tuple([
    z.number().min(1).max(30),
    z.number().min(1).max(30),
  ]),
  teams: z.array(z.number()),
  players: z.array(z.number()),
  positions: z.array(z.enum(POSITIONS)),
  result: z.enum(RESULTS),
});

export const FilterForm = () => {
  const { currentFilter, saveFilter } = useFilters();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { ...currentFilter.filters },
  });

  function onSubmit(data: z.infer<typeof schema>) {
    saveFilter({ ...currentFilter, filters: data as Filter });
    form.reset(data);
  }

  useEffect(() => {
    form.reset({ ...currentFilter.filters });
  }, [currentFilter.filters, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="season"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Season</FormLabel>
              <Combobox
                {...field}
                options={SEASONS}
                onSelect={(value) =>
                  form.setValue('season', value, { shouldDirty: true })
                }
                className="w-full"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defensiveRatingRank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                DRTG Ranking
                <Tooltip delayDuration={500}>
                  <TooltipTrigger>
                    <InformationCircleIcon className="size-5" />
                  </TooltipTrigger>

                  <TooltipContent>
                    <p>
                      DRTG ranking of the opposing team during the month of the
                      game.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </FormLabel>

              <RangeSlider
                min={1}
                max={30}
                step={1}
                value={field.value}
                label={(item) => item}
                onValueChange={(value) =>
                  form.setValue(
                    'defensiveRatingRank',
                    value as typeof field.value,
                    { shouldDirty: true },
                  )
                }
                className="w-full"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="offensiveRatingRank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                ORTG Ranking
                <Tooltip delayDuration={500}>
                  <TooltipTrigger>
                    <InformationCircleIcon className="size-5" />
                  </TooltipTrigger>

                  <TooltipContent>
                    <p>
                      ORTG ranking of the atacking team during the month of the
                      game.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </FormLabel>

              <RangeSlider
                min={1}
                max={30}
                step={1}
                value={field.value}
                label={(item) => item}
                onValueChange={(value) =>
                  form.setValue(
                    'offensiveRatingRank',
                    value as typeof field.value,
                    { shouldDirty: true },
                  )
                }
                className="w-full"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="teams"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teams</FormLabel>

              <MultiCombobox
                values={field.value}
                options={TEAMS}
                onSelect={(values) =>
                  form.setValue('teams', values, { shouldDirty: true })
                }
                className="w-full"
                multiSelectedMessage="teams selected"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="players"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Players</FormLabel>

              <MultiCombobox
                values={field.value}
                options={[]}
                onSelect={(values) =>
                  form.setValue('players', values, { shouldDirty: true })
                }
                className="w-full"
                multiSelectedMessage="players selected"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="positions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Positions</FormLabel>

              <ToggleGroup
                type="multiple"
                value={field.value}
                onValueChange={(values) =>
                  form.setValue('positions', values as typeof field.value, {
                    shouldDirty: true,
                  })
                }
                className="w-full"
              >
                {POSITIONS.map((option) => (
                  <ToggleGroupItem value={option} key={option}>
                    {option}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="result"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Result</FormLabel>

              <Tabs
                value={field.value}
                onValueChange={(value) =>
                  form.setValue('result', value as typeof field.value, {
                    shouldDirty: true,
                  })
                }
              >
                <TabsList className="w-full">
                  {RESULTS.map((option) => (
                    <TabsTrigger
                      key={option}
                      value={option}
                      className="capitalize"
                    >
                      {option}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isDirty}
        >
          Apply
        </Button>
      </form>
    </Form>
  );
};
