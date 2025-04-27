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

const seasons = [
  { label: '2023-24', value: 24 },
  { label: '2022-23', value: 23 },
  { label: '2021-22', value: 22 },
  { label: '2020-21', value: 21 },
  { label: '2019-20', value: 20 },
  { label: '2018-19', value: 19 },
  { label: '2017-18', value: 18 },
  { label: '2016-17', value: 17 },
  { label: '2015-16', value: 16 },
  { label: '2014-15', value: 15 },
  { label: '2013-14', value: 14 },
  { label: '2012-13', value: 13 },
  { label: '2011-12', value: 12 },
  { label: '2010-11', value: 11 },
  { label: '2009-10', value: 10 },
  { label: '2008-09', value: 9 },
  { label: '2007-08', value: 8 },
  { label: '2006-07', value: 7 },
  { label: '2005-06', value: 6 },
  { label: '2004-05', value: 5 },
  { label: '2003-04', value: 4 },
];

const teams = [
  { label: 'Atlanta Hawks', value: 1610612737 },
  { label: 'Boston Celtics', value: 1610612738 },
  { label: 'Brooklyn Nets', value: 1610612739 },
  { label: 'Charlotte Hornets', value: 1610612740 },
  { label: 'Chicago Bulls', value: 1610612741 },
  { label: 'Cleveland Cavaliers', value: 1610612742 },
  { label: 'Dallas Mavericks', value: 1610612743 },
  { label: 'Denver Nuggets', value: 1610612744 },
  { label: 'Detroit Pistons', value: 1610612745 },
  { label: 'Golden State Warriors', value: 1610612746 },
  { label: 'Houston Rockets', value: 1610612747 },
  { label: 'Indiana Pacers', value: 1610612748 },
  { label: 'Los Angeles Clippers', value: 1610612749 },
  { label: 'Los Angeles Lakers', value: 1610612750 },
  { label: 'Memphis Grizzlies', value: 1610612751 },
  { label: 'Miami Heat', value: 1610612752 },
  { label: 'Milwaukee Bucks', value: 1610612753 },
  { label: 'Minnesota Timberwolves', value: 1610612754 },
  { label: 'New Orleans Pelicans', value: 1610612755 },
  { label: 'New York Knicks', value: 1610612756 },
  { label: 'Oklahoma City Thunder', value: 1610612757 },
  { label: 'Orlando Magic', value: 1610612758 },
  { label: 'Philadelphia 76ers', value: 1610612759 },
  { label: 'Phoenix Suns', value: 1610612760 },
  { label: 'Portland Trail Blazers', value: 1610612761 },
  { label: 'Sacramento Kings', value: 1610612762 },
  { label: 'San Antonio Spurs', value: 1610612763 },
  { label: 'Toronto Raptors', value: 1610612764 },
  { label: 'Utah Jazz', value: 1610612765 },
  { label: 'Washington Wizards', value: 1610612766 },
];

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
const RESULTS = ['all', 'wins', 'losses'] as const;

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
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      season: seasons[0].value,
      defensiveRatingRank: [1, 30],
      offensiveRatingRank: [1, 30],
      teams: [],
      players: [],
      positions: [...POSITIONS],
      result: RESULTS[0],
    },
  });

  function onSubmit(data: z.infer<typeof schema>) {
    console.log(data);
  }

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
                options={seasons}
                onSelect={(value) => form.setValue('season', value)}
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
                options={teams}
                onSelect={(values) => form.setValue('teams', values)}
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
                onSelect={(values) => form.setValue('players', values)}
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
                  form.setValue('positions', values as typeof field.value)
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
                  form.setValue('result', value as typeof field.value)
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

        <Button type="submit" className="w-full">
          Apply
        </Button>
      </form>
    </Form>
  );
};
