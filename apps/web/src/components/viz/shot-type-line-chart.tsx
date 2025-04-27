import { ClockSummary } from '@/types';
import { useMemo } from 'react';
import {
  LineChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  Line,
} from 'recharts';

const roundTo = (num: number, precision: number) => {
  return Math.round(num * 10 ** precision) / 10 ** precision;
};

export const ShotTypeLineChart = ({
  data,
}: {
  data: {
    twos: ClockSummary[];
    threes: ClockSummary[];
  };
}) => {
  const chartData = useMemo(() => {
    return data.twos
      .map((item) => {
        const item3pt = data.threes.find((three) => item.id === three.id);

        return {
          minute: item.id,
          threes: roundTo((item3pt?.accuracy ?? 0) * 100, 2),
          twos: roundTo(item.accuracy * 100, 2),
        };
      })
      .filter((item) => item.minute < 80);
  }, [data]);

  return (
    <LineChart
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

      <Tooltip />
      <Legend />
    </LineChart>
  );
};
