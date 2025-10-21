import { regionSync } from '@/stores/chart-sync';
import { useStats } from '@/stores/stats';
import { BASIC_ZONES } from '@nba-viz/data';
import { useCallback, useMemo, useRef } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useAtom } from 'jotai';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { useTranslation } from 'react-i18next';

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
  const [, setActiveIndex] = useAtom(regionSync);

  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const allZonesData = Object.keys(BASIC_ZONES)
      .filter((key) => key !== '7')
      .map((key) => {
        const zone = data.find((item) => item.basicZone === Number(key));

        return {
          total: zone?.totalMade ?? 0,
          made: zone?.totalMade ?? 0,
          accuracy: zone ? (zone.totalMade / zone.totalShots) * 100 : 0,
          region: BASIC_ZONES[key as keyof typeof BASIC_ZONES],
          basicZone: Number(key),
        };
      });

    return allZonesData.sort(
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
        made: stats.made,
        accuracy: stats.total === 0 ? 0 : (stats.made / stats.total) * 100,
      };
    },
    [data],
  );

  const threePointStats = useMemo(() => getStats([1, 4, 6, 7]), [getStats]);
  const twoPointStats = useMemo(() => getStats([2, 3, 5]), [getStats]);

  const abortController = useRef<AbortController | null>(null);

  const setChartRef = useCallback(
    (chart: CategoricalChartWrapper | null) => {
      abortController.current?.abort();

      if (chart === null) {
        abortController.current = null;
        return;
      }

      const newController = new AbortController();
      abortController.current = newController;

      if (chartData.length === 0) {
        return;
      }

      chart.container.addEventListener(
        'mousemove',
        () => {
          setActiveIndex(chart.state.activeLabel?.toString() ?? null);
        },
        { signal: newController.signal },
      );

      chart.container.addEventListener(
        'mouseleave',
        () => {
          setActiveIndex(null);
        },
        { signal: newController.signal },
      );

      setActiveIndex(null);
    },
    [chartData, setActiveIndex],
  );

  const efgAccuracy = useMemo(() => {
    const total = twoPointStats.total + threePointStats.total;

    if (total === 0) {
      return 0;
    }

    return ((twoPointStats.made + 1.5 * threePointStats.made) / total) * 100;
  }, [twoPointStats, threePointStats]);

  return (
    <div className="flex flex-col w-full gap-4 -mx-4">
      <div className="grid grid-rows-3 @xs:grid-cols-[repeat(3,minmax(auto,200px))] @xs:grid-rows-1 justify-center px-4 gap-4 w-full">
        <Stat
          label={t('basketball.stats.twoPointer')}
          total={twoPointStats.total}
          accuracy={twoPointStats.accuracy}
        />
        <Stat
          label={t('basketball.stats.threePointer')}
          total={threePointStats.total}
          accuracy={threePointStats.accuracy}
        />
        <Stat
          label="eFG%"
          accuracy={efgAccuracy}
          hints={[
            t('basketball.stats.eFG.title'),
            t('basketball.stats.eFG.description'),
          ]}
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
            ref={setChartRef as any}
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
            <RechartsTooltip content={<EmptyTooltip />} />
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
  accuracy,
  total,
  hints,
}: {
  label: string;
  accuracy: number;
  total?: number;
  hints?: string[];
}) => {
  const formattedTotal = useMemo(
    () => (total ? bigFormatter.format(total) : null),
    [total],
  );
  const formattedAccuracy = useMemo(
    () => percentageFormatter.format(accuracy),
    [accuracy],
  );
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs leading-none text-muted-foreground flex items-center gap-1">
        {label}

        {hints && (
          <Tooltip delayDuration={500}>
            <TooltipTrigger>
              <InformationCircleIcon className="size-4" />
            </TooltipTrigger>

            <TooltipContent className="flex flex-col items-center">
              {hints.map((h) => (
                <div key={h}>{h}</div>
              ))}
            </TooltipContent>
          </Tooltip>
        )}
      </span>

      <div className="flex items-center divide-x divide-muted-foreground/30">
        {formattedTotal !== null && (
          <span className="text-base leading-none font-medium px-2">
            {formattedTotal}
          </span>
        )}
        <span className="text-base leading-none font-medium px-2">
          {formattedAccuracy}%
        </span>
      </div>
    </div>
  );
};
