'use client';

import { useMemo } from 'react';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
} from 'recharts';

interface Zone {
  count: number;
  totalMade: number;
  totalMissed: number;
  accuracy: number;
  frequency: number;
  key: string;
}

interface ChartData {
  id: number;
  name: string;
  zones: Zone[];
}

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7f50',
  '#9f7dfb',
  '#8c9eff',
  '#f4f090',
  '#f090a1',
  '#a1f0a1',
  '#a1ffc6',
  '#c6ffc6',
  '#ffc6a1',
  '#ffc68c',
];

const roundTo = (num: number, precision: number) => {
  return Math.round(num * 10 ** precision) / 10 ** precision;
};

export const Chart = ({ data }: { data: ChartData[] }) => {
  const chartData = useMemo(() => {
    const sections = data.length ? data[0].zones : [];

    return sections.map((zone) => {
      return {
        subject: zone.key,
        ...data.reduce((acc, curr) => {
          const currZone = curr.zones.find((z) => z.key === zone.key);

          return {
            ...acc,
            [curr.id]: roundTo((currZone?.frequency ?? 0) * 100, 1),
          };
        }, {}),
      };
    });
  }, [data]);

  const maxValue = useMemo(() => {
    let max = 0;

    for (const item of data) {
      for (const value of item.zones) {
        max = Math.ceil(Math.max(max, value.frequency * 100));
      }
    }

    return max;
  }, [data]);

  return (
    <RadarChart
      cx={300}
      cy={250}
      outerRadius={150}
      width={700}
      height={500}
      data={chartData}
    >
      <PolarGrid />
      <PolarAngleAxis dataKey="subject" />
      <PolarRadiusAxis angle={30} domain={[0, maxValue]} />

      {data.map((item) => (
        <Radar
          key={item.id}
          name={item.name}
          dataKey={item.id}
          stroke={COLORS[item.id % COLORS.length]}
          fill={COLORS[item.id % COLORS.length]}
          fillOpacity={0.6}
        />
      ))}

      <Tooltip />
      <Legend />
    </RadarChart>
  );
};
