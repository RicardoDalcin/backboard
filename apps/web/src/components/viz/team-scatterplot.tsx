import { db } from '@/server/db';
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo } from 'react';
import { TEAMS } from '@nba-viz/data';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useFormatter } from '@/stores/formatter';

type StatsByTeam = Awaited<ReturnType<typeof db.getStatsByTeam>>;

const roundTo = (value: number, precision: number) => {
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
};

export function TeamScatterplot({ data }: { data: StatsByTeam }) {
  const formatter = useFormatter();
  const { t } = useTranslation();

  const conferences = useMemo(
    () => [
      {
        id: 'eastern',
        label: t('basketball.conferences.eastern'),
        fill: '#b57a2d',
      },
      {
        id: 'western',
        label: t('basketball.conferences.western'),
        fill: '#4c699c',
      },
    ],
    [t],
  );

  const chartData = useMemo(() => {
    return data.map((item) => {
      const totalShots = item.total2PtShots + item.total3PtShots;
      const eFG = (item.total2PtMade + 1.5 * item.total3PtMade) / totalShots;
      const team = TEAMS.find((t) => t.id === item.teamId);
      const conference = team?.conference;

      return {
        teamName: team?.name ?? '',
        conference,
        data: item,
        x: totalShots,
        y: roundTo(eFG * 100, 2),
      };
    });
  }, [data]);

  const groupedByConference = useMemo(() => {
    return conferences.map((conference) => {
      return {
        conference,
        data: chartData.filter((item) => item.conference === conference.id),
      };
    });
  }, [chartData, conferences]);

  const xDomain = useMemo(() => {
    return [
      Math.min(...chartData.map((item) => item.x)),
      Math.max(...chartData.map((item) => item.x)),
    ];
  }, [chartData]);

  const yDomain = useMemo(() => {
    return [
      Math.floor(Math.min(...chartData.map((item) => item.y))),
      Math.ceil(Math.max(...chartData.map((item) => item.y))),
    ];
  }, [chartData]);

  return (
    <ResponsiveContainer
      minWidth="100%"
      width="100%"
      style={{ paddingTop: '8px', paddingRight: '8px' }}
      minHeight={200}
      aspect={1}
    >
      <ScatterChart>
        <CartesianGrid strokeDasharray="4" />

        <XAxis
          domain={xDomain}
          type="number"
          dataKey="x"
          name="totalShots"
          tickFormatter={formatter.bigNumber.format}
          className="text-xs"
        />
        <YAxis
          domain={yDomain}
          type="number"
          dataKey="y"
          name="eFG%"
          unit="%"
          className="text-xs"
          width={40}
        />

        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={CustomTooltip} />
        <Legend />
        {groupedByConference.map((item) => {
          return (
            <Scatter
              key={item.conference.id}
              name={item.conference.label}
              data={item.data}
              fill={item.conference.fill}
              shape="square"
            />
          );
        })}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  const data = payload?.[0]?.payload;
  const { t } = useTranslation();
  const formatter = useFormatter();
  return (
    <AnimatePresence>
      {!!(active && payload && payload.length) && (
        <motion.div
          className={cn(
            'rounded-md text-primary bg-white/90 border touch-none pointer-events-none z-20',
          )}
          initial={{
            opacity: 0,
            scale: 0.7,
            transition: { type: 'keyframes', duration: 2 },
          }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: {
              type: 'spring',
              stiffness: 150,
              damping: 10,
              bounce: 0,
              mass: 0.1,
            },
          }}
          exit={{
            opacity: 0,
            scale: 0.7,
            transition: { type: 'keyframes', duration: 0.2 },
          }}
          style={{
            width: `auto`,
          }}
        >
          <div className="w-full h-full px-4 py-2 flex flex-col justify-between">
            <span className="text-sm font-bold">{data?.teamName}</span>

            <span className="text-sm flex items-center gap-1 lowercase">
              <strong>{formatter.bigNumber.format(data?.x)}</strong>
              {t('basketball.stats.shots')}
            </span>

            <span className="text-sm flex items-center gap-1">
              <strong>{formatter.percentage.format(data?.y)}%</strong>
              eFG%
            </span>

            <span className="text-sm flex items-center gap-1">
              <strong>
                {formatter.bigNumber.format(data?.data?.total2PtMade)}
              </strong>
              2pts
            </span>

            <span className="text-sm flex items-center gap-1">
              <strong>
                {formatter.bigNumber.format(data?.data?.total3PtMade)}
              </strong>
              3pts
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
