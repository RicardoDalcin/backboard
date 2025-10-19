import { regionSync } from '@/stores/chart-sync';
import { useStats } from '@/stores/stats';
import { BASIC_ZONES } from '@nba-viz/data';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useAtom } from 'jotai';

const bigFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type CategoricalChartWrapper = {
  container: HTMLDivElement;
  state: {
    activeLabel: number | null;
    prevData: {
      regionIndex: number;
      region: string;
      total: number;
      made: number;
      accuracy: number;
    }[];
  };
};

const ZONE_ORDER = [2, 3, 6, 1, 4, 5];

export const ShotRegionChart = ({
  data,
}: {
  data: ReturnType<typeof useStats>['statSummary'];
}) => {
  const chartRef = useRef<CategoricalChartWrapper | null>(null);
  const [activeIndex, setActiveIndex] = useAtom(regionSync);

  const chartData = useMemo(() => {
    return data
      .filter((item) => item.basicZone !== 7)
      .map((item) => {
        return {
          total: item.totalShots,
          made: item.totalMade,
          accuracy: (item.totalMade / item.totalShots) * 100,
          region: BASIC_ZONES[item.basicZone],
          basicZone: item.basicZone,
        };
      })
      .sort(
        (a, b) =>
          ZONE_ORDER.indexOf(a.basicZone) - ZONE_ORDER.indexOf(b.basicZone),
      );
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

  const index = useMemo(() => {
    if (!chartRef.current || activeIndex === undefined) {
      return undefined;
    }

    if (activeIndex === null) {
      return null;
    }

    const idx = chartRef.current.state.prevData.findIndex(
      (item) => item.region === activeIndex,
    );

    if (idx === -1) {
      return null;
    }

    return idx;
  }, [activeIndex]);

  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) {
      return;
    }

    const abortController = new AbortController();

    chartRef.current.container.addEventListener(
      'mousemove',
      () => {
        setActiveIndex(chartRef.current?.state.activeLabel?.toString() ?? null);
      },
      { signal: abortController.signal },
    );

    chartRef.current.container.addEventListener(
      'mouseleave',
      () => {
        setActiveIndex(null);
      },
      { signal: abortController.signal },
    );

    setActiveIndex(null);

    return () => {
      abortController.abort();
    };
  }, [chartData, setActiveIndex]);

  return (
    <div className="flex flex-col w-full gap-4 -mx-4">
      <div className="grid grid-rows-2 @xs:grid-cols-[repeat(2,minmax(auto,200px))] @xs:grid-rows-1 justify-center px-4 gap-4 w-full">
        <Stat
          label="2PT shots"
          total={twoPointStats.total}
          accuracy={twoPointStats.accuracy}
        />
        <Stat
          label="3PT shots"
          total={threePointStats.total}
          accuracy={threePointStats.accuracy}
        />
      </div>

      <div className="relative">
        <ResponsiveContainer
          minWidth="100%"
          width="100%"
          minHeight={200}
          aspect={1}
        >
          <RadarChart
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={chartRef as any}
            cx="50%"
            cy="50%"
            outerRadius="60%"
            data={chartData}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="region" fontSize="80%" />
            <PolarRadiusAxis tick={false} />
            <Radar
              name="Total"
              dataKey="total"
              stroke="#4c699c"
              fill="#4c699c"
              fillOpacity={0.6}
            />
            <Tooltip
              active={index !== null && index !== undefined}
              defaultIndex={index ?? undefined}
              content={<EmptyTooltip />}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const EmptyTooltip = () => {
  return <div className="touch-none pointer-events-none hidden"></div>;
};

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
