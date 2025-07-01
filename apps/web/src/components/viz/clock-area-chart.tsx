import { useChartSync } from '@/stores/chart-sync';
import { ClockSummary } from '@/types';
import { useEffect, useMemo, useRef } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type CategoricalChartWrapper = {
  container: HTMLDivElement;
  state: {
    activeLabel: number | null;
    prevData: { minute: number; threes: number; twos: number }[];
  };
};

export const ClockAreaChart = ({ data }: { data: ClockSummary[] }) => {
  const chartRef = useRef<CategoricalChartWrapper | null>(null);
  const { activeIndex, setActiveIndex } = useChartSync('clock-area');

  const chartData = useMemo(() => {
    return data.map((item) => ({
      minute: item.id,
      total: item.count,
      made: item.totalMade,
    }));
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
      <AreaChart
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={chartRef as any}
        cx={300}
        cy={250}
        outerRadius={150}
        data={chartData}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="minute" />
        <YAxis />

        <Area
          type="linear"
          dataKey="total"
          stackId={1}
          stroke="#000000"
          fill="#000000"
          name="Total Shots"
        />
        <Area
          type="linear"
          dataKey="made"
          stackId={2}
          stroke="#4ADE80"
          fill="#4ADE80"
          name="Made Shots"
        />

        <Tooltip active={index !== null} defaultIndex={index ?? undefined} />
        <Legend />
      </AreaChart>
    </ResponsiveContainer>
  );
};
