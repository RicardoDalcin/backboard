import { useStats } from '@/stores/stats';
import { BASIC_ZONES } from '@nba-viz/data';
import { useCallback, useMemo } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from 'recharts';
import {
  type NameType,
  type ValueType,
} from 'recharts/types/component/DefaultTooltipContent';

const CustomTooltip = ({
  active,
  payload,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg px-3 py-2">
        <p className="text-sm font-medium mb-1">{data.payload.region}</p>
        <p className="text-sm text-muted-foreground">
          Total Shots:{' '}
          <span className="font-medium text-foreground">
            {bigFormatter.format(Number(data.value))}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Accuracy:{' '}
          <span className="font-medium text-foreground">
            {percentageFormatter.format(data.payload.accuracy)}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export const ShotRegionChart = ({
  data,
}: {
  data: ReturnType<typeof useStats>['statSummary'];
}) => {
  const chartData = useMemo(() => {
    return data
      .filter((item) => item.basicZone !== 7)
      .map((item) => {
        return {
          total: item.totalShots,
          made: item.totalMade,
          accuracy: (item.totalMade / item.totalShots) * 100,
          region: BASIC_ZONES[item.basicZone],
        };
      });
  }, [data]);

  const getStats = useCallback(
    (zones: number[]) => {
      const stats = data.reduce(
        (acc, region) => {
          if (!zones.includes(region.basicZone)) {
            return acc;
          }

          return {
            total: acc.total + region.totalShots,
            made: acc.made + region.totalMade,
          };
        },
        { total: 0, made: 0 },
      );

      return {
        total: stats.total,
        accuracy: stats.total === 0 ? 0 : (stats.made / stats.total) * 100,
      };
    },
    [data],
  );

  const threePointStats = useMemo(() => getStats([1, 4, 6, 7]), [getStats]);
  const twoPointStats = useMemo(() => getStats([2, 3, 5]), [getStats]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(2,minmax(auto,200px))] justify-center px-4 gap-4 w-full">
        <Stat
          label="3PT shots"
          total={threePointStats.total}
          accuracy={threePointStats.accuracy}
        />
        <Stat
          label="2PT shots"
          total={twoPointStats.total}
          accuracy={twoPointStats.accuracy}
        />
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="region" fontSize="80%" />
          <PolarRadiusAxis tick={false} />
          <Radar
            name="Total"
            dataKey="total"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

const bigFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const Stat = ({
  label,
  total,
  accuracy,
}: {
  label: string;
  total: number;
  accuracy: number;
}) => {
  const formattedTotal = useMemo(() => bigFormatter.format(total), [total]);
  const formattedAccuracy = useMemo(
    () => percentageFormatter.format(accuracy),
    [accuracy],
  );
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs leading-none text-muted-foreground">
        {label}
      </span>

      <div className="flex items-center divide-x divide-muted-foreground/30">
        <span className="text-base leading-none font-medium px-2">
          {formattedTotal}
        </span>
        <span className="text-base leading-none font-medium px-2">
          {formattedAccuracy}%
        </span>
      </div>
    </div>
  );
};
