import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { useFilters } from '@/stores/filters';
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
import {
  POSITIONS,
  RESULTS,
  SEASONS,
  TEAMS,
  PLAYERS,
  Filter,
} from '@/types/filters';
import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { CreateFilterDialog } from './create-filter';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

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

export const Filters = ({ className }: { className?: string }) => {
  const { filters, currentFilter, selectFilter, saveFilter, newFilter, deleteFilter } =
    useFilters();

  const [filterCreateType, setFilterCreateType] = useState<
    'new' | 'copy' | 'edit'
  >('new');

  const [editingFilterId, setEditingFilterId] = useState<number | null>(null);
  const [editingFilterName, setEditingFilterName] = useState('');

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

  const onCreateFilter = useCallback(
    (name: string) => {
      if (editingFilterId && filterCreateType === 'edit') {
        saveFilter({
          id: editingFilterId,
          name,
          filters: form.getValues() as Filter,
        });
        setFilterCreateType('new');
        return;
      }

      const newId = newFilter(name);

      if (filterCreateType === 'copy') {
        saveFilter({ id: newId, name, filters: form.getValues() as Filter });
      }

      selectFilter(newId);
    },
    [
      editingFilterId,
      filterCreateType,
      form,
      newFilter,
      saveFilter,
      selectFilter,
    ],
  );

  return (
    <Card
      className={clsx('flex flex-col gap-5 w-[350px] h-min px-5', className)}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger className="-ml-2 shrink-1 min-w-0" asChild>
              <Button variant="ghost">
                <p className="text-lg font-semibold truncate">
                  {currentFilter.name}
                </p>
                <ChevronDownIcon className="size-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[280px]" align="start">
              <DialogTrigger asChild onClick={() => setFilterCreateType('new')}>
                <DropdownMenuItem>
                  Create filter
                  <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DialogTrigger>

              <DialogTrigger
                asChild
                onClick={() => setFilterCreateType('copy')}
              >
                <DropdownMenuItem>
                  Save as new filter
                  <DropdownMenuShortcut>⌘shift+N</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DialogTrigger>

              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={String(currentFilter.id)}
                onValueChange={(newValue) => selectFilter(Number(newValue))}
              >
                {filters.map((filter) => (
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <DropdownMenuRadioItem
                        key={filter.id}
                        value={String(filter.id)}
                      >
                        {filter.name}
                      </DropdownMenuRadioItem>
                    </ContextMenuTrigger>

                    <ContextMenuContent className="w-[200px]">
                      <ContextMenuItem onClick={() => selectFilter(filter.id)}>
                        Select
                      </ContextMenuItem>

                      <DialogTrigger asChild>
                        <ContextMenuItem
                          onClick={() => {
                            setEditingFilterName(filter.name);
                            setFilterCreateType('edit');
                            setEditingFilterId(filter.id);
                          }}
                        >
                          Rename
                        </ContextMenuItem>
                      </DialogTrigger>

                      <ContextMenuSeparator />

                      <ContextMenuItem
                        onClick={() => deleteFilter(filter.id)}
                        variant="destructive"
                      >
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <CreateFilterDialog
            onCreate={onCreateFilter}
            defaultName={
              filterCreateType === 'edit' ? editingFilterName : undefined
            }
          />
        </Dialog>

        <Button
          variant="ghost"
          className="-mr-2 shrink-0"
          disabled={!form.formState.isDirty}
          onClick={() => form.reset()}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-4.5"
          >
            <path
              d="M3.75 10.8331C3.95405 12.4532 4.74555 13.942 5.97437 15.0172C7.2032 16.0924 8.78389 16.6793 10.4167 16.6665C11.495 16.6653 12.557 16.4026 13.5116 15.9008C14.4661 15.3991 15.2847 14.6732 15.897 13.7856C16.5094 12.898 16.8973 11.8751 17.0275 10.8046C17.1577 9.73408 17.0262 8.64799 16.6444 7.63947C16.2626 6.63095 15.6419 5.73009 14.8354 5.01419C14.029 4.29828 13.0609 3.78869 12.0142 3.52913C10.9675 3.26957 9.87354 3.26779 8.82603 3.52394C7.77852 3.78009 6.80878 4.28652 6 4.9998L3.75 6.9998"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7.91667 7.4998L3.75 7.4998L3.75 3.33314"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Clear
        </Button>
      </div>

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
                        DRTG ranking of the opposing team during the month of
                        the game.
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
                        ORTG ranking of the atacking team during the month of
                        the game.
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
                  options={PLAYERS}
                  maxOptions={50}
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
    </Card>
  );
};
