import { ClockSummary } from '@/types';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const ClockAreaChart = ({ data }: { data: ClockSummary[] }) => {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      minute: item.id,
      total: item.count,
      made: item.totalMade,
    }));
  }, [data]);

  return (
    <AreaChart
      cx={300}
      cy={250}
      outerRadius={150}
      width={700}
      height={500}
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

      <Tooltip />
      <Legend />
    </AreaChart>
  );
};
