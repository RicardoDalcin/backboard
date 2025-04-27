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

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
const RESULTS = ['all', 'wins', 'losses'] as const;

const schema = z.object({
  season: z.number().min(4).max(24),
  defensiveRatingRankLower: z.number().min(1).max(30),
  defensiveRatingRankUpper: z.number().min(1).max(30),
  offensiveRatingRankLower: z.number().min(1).max(30),
  offensiveRatingRankUpper: z.number().min(1).max(30),
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
      defensiveRatingRankLower: 1,
      defensiveRatingRankUpper: 30,
      offensiveRatingRankLower: 1,
      offensiveRatingRankUpper: 30,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <Button type="submit" className="w-full">
          Apply
        </Button>
      </form>
    </Form>
  );
};
