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
import { PLAYERS } from '@nba-viz/data';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useFormatter } from '@/stores/formatter';
import { ContentType } from 'recharts/types/component/DefaultLegendContent';

type StatsByPlayer = Awaited<ReturnType<typeof db.getStatsByPlayer>>;

const roundTo = (value: number, precision: number) => {
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
};

const MIN_EFG = 0.3;
const MAX_EFG = 0.75;

const PLAYER_HEIGHT_GROUPS = [
  {
    id: 2,
    label: `6"0'+`,
    fill: 'oklch(45.3% 0.124 130.933)',
    shape: 'circle',
    from: 5 * 12 + 7,
    to: 6 * 12 + 5,
  },
  {
    id: 3,
    label: `6"6'+`,
    fill: 'oklch(44.3% 0.11 240.79)',
    shape: 'square',
    from: 6 * 12 + 6,
    to: 6 * 12 + 9,
  },
  {
    id: 4,
    label: `6"10'+`,
    fill: 'oklch(45.9% 0.187 3.815)',
    shape: 'triangle',
    from: 6 * 12 + 10,
    to: 8 * 12,
  },
] as const;

export function PlayerScatterplot({ data }: { data: StatsByPlayer }) {
  const formatter = useFormatter();
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    return data
      .filter((item) => {
        const total = item.total2PtShots + item.total3PtShots;
        const eFG = (item.total2PtMade + 1.5 * item.total3PtMade) / total;
        return total > 5 && eFG >= MIN_EFG && eFG <= MAX_EFG;
      })
      .map((item) => {
        const totalShots = item.total2PtShots + item.total3PtShots;
        const eFG = (item.total2PtMade + 1.5 * item.total3PtMade) / totalShots;
        const player = PLAYERS.find((p) => p.id === item.playerId);
        const measures = player?.height.split('-');
        const feet = Number(measures?.[0] ?? 0);
        const inches = Number(measures?.[1] ?? 0);
        const height = feet * 12 + inches;
        const group = PLAYER_HEIGHT_GROUPS.find(
          (group) => height >= group.from && height <= group.to,
        );
        const groupId = group?.id ?? 0;

        return {
          playerName: player?.name ?? '',
          groupId,
          data: item,
          x: totalShots,
          y: roundTo(eFG * 100, 2),
        };
      });
  }, [data]);

  const groupedByHeight = useMemo<
    Array<{ heightGroup: number; data: typeof chartData }>
  >(() => {
    return PLAYER_HEIGHT_GROUPS.map((group) => {
      return {
        heightGroup: group.id,
        data: chartData.filter((item) => item.groupId === group.id),
      };
    });
  }, [chartData]);

  return (
    <ResponsiveContainer
      minWidth="100%"
      width="100%"
      style={{ paddingTop: '8px', paddingRight: '8px', paddingLeft: '4px' }}
      minHeight={200}
      aspect={1}
    >
      <ScatterChart>
        <CartesianGrid strokeDasharray="4" />

        <XAxis
          type="number"
          dataKey="x"
          name="totalShots"
          tickFormatter={formatter.bigNumber.format}
          className="text-xs"
          height={55}
          label={{value: t('explore.volume'), position: 'insideCenter'}}
        />
        <YAxis
          domain={[MIN_EFG * 100, MAX_EFG * 100]}
          type="number"
          dataKey="y"
          name="eFG%"
          unit="%"
          className="text-xs"
          width={50}
          label={{value: t('explore.efficiency'), angle: -90, position: 'insideLeft'}}
        />

        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={CustomTooltip} />
        <Legend content={CustomLegend} />
        {groupedByHeight.map((item) => {
          const heightGroup = PLAYER_HEIGHT_GROUPS.find(
            (group) => group.id === item.heightGroup,
          );
          return (
            <Scatter
              name={heightGroup?.label ?? ''}
              data={item.data}
              fill={heightGroup?.fill ?? '#4c699c'}
              shape={heightGroup?.shape ?? 'square'}
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
            <span className="text-sm font-bold">{data?.playerName}</span>

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

const CircleShape = ({ fill }: { fill: string }) => {
  return (
    <div
      className="w-2.5 h-2.5 rounded-full"
      style={{ backgroundColor: fill }}
    />
  );
};

const SquareShape = ({ fill }: { fill: string }) => {
  return <div className="w-2.5 h-2.5" style={{ backgroundColor: fill }} />;
};

const TriangleShape = ({ fill }: { fill: string }) => {
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: `12px solid ${fill}`,
      }}
    />
  );
};

const CustomLegend: ContentType = ({ payload }) => {
  return (
    <div className="flex items-center gap-3 justify-center">
      {payload?.map((item, index) => {
        return (
          <div key={item.value} className="flex items-center gap-1">
            {index === 0 && <CircleShape fill={item.color ?? '#4c699c'} />}
            {index === 1 && <SquareShape fill={item.color ?? '#4c699c'} />}
            {index === 2 && <TriangleShape fill={item.color ?? '#4c699c'} />}
            <span className="text-sm">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
};
