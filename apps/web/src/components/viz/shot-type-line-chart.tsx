import { useChartSync } from '@/stores/chart-sync';
import { ClockSummary } from '@/types';
import { useEffect, useMemo, useRef } from 'react';
import {
  LineChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  ResponsiveContainer,
} from 'recharts';

const roundTo = (num: number, precision: number) => {
  return Math.round(num * 10 ** precision) / 10 ** precision;
};

type CategoricalChartWrapper = {
  container: HTMLDivElement;
  state: {
    activeLabel: number | null;
    prevData: { minute: number; threes: number; twos: number }[];
  };
};

export const ShotTypeLineChart = ({
  data,
}: {
  data: {
    twos: ClockSummary[];
    threes: ClockSummary[];
  };
}) => {
  const { activeIndex, setActiveIndex } = useChartSync('shot-type');
  const chartRef = useRef<CategoricalChartWrapper | null>(null);

  const chartData = useMemo(() => {
    return data.twos
      .map((item) => {
        const item3pt = data.threes.find((three) => item.id === three.id);

        return {
          minute: item.id,
          threes: roundTo((item3pt?.accuracy ?? 0) * 100, 1),
          twos: roundTo(item.accuracy * 100, 1),
        };
      })
      .filter((item) => item.minute < 80);
  }, [data]);

  const index = useMemo(() => {
    if (!chartRef.current || activeIndex === undefined) {
      return undefined;
    }

    if (activeIndex === null) {
      return null;
    }

    const idx = chartRef.current.state.prevData.findIndex(
      (item) => item.minute === activeIndex,
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
        setActiveIndex(chartRef.current?.state.activeLabel ?? null);
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

    return () => {
      abortController.abort();
    };
  }, [chartData, setActiveIndex]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={chartRef as any}
        cx={300}
        cy={250}
        outerRadius={150}
        width={596}
        height={434}
        data={chartData}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="minute" />
        <YAxis domain={[0, 100]} />

        <Line type="monotone" dataKey="twos" stroke="#82ca9d" name="FG%" />
        <Line type="monotone" dataKey="threes" stroke="#8884d8" name="3P%" />

        <Tooltip active={index !== null} defaultIndex={index ?? undefined} />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
};
