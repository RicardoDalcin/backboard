import { HoverCallbackData } from '@/engine/Visualization';
import { cn } from '@/lib/utils';
import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useFormatter } from '@/stores/formatter';
import { useTranslation } from 'react-i18next';

const roundTo = (num: number, precision: number) => {
  return Math.round(num * 10 ** precision) / 10 ** precision;
};

function useLastValid<T>(value: T, isNull: (value: T) => boolean) {
  const [lastValid, setLastValid] = useState(value);

  useEffect(() => {
    if (isNull(value)) {
      return;
    }

    setLastValid(value);
  }, [value, isNull]);

  return lastValid;
}

function useDebounce<T>(
  value: T,
  delay: number,
  isNull: (value: T) => boolean,
) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (!isNull(value)) {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, isNull]);

  return debouncedValue;
}
const WIDTH = 160;
const HEIGHT = 70;
const PADDING = 12;

export const CourtTooltip = ({
  shots: hoveredShot,
  container,
}: {
  shots: HoverCallbackData;
  container: RefObject<HTMLDivElement | null>;
}) => {
  const formatter = useFormatter();
  const { t } = useTranslation();

  const shots = useDebounce(hoveredShot, 200, (s) => s?.totalShots === 0);

  const getX = useCallback(
    (shotX: number) => {
      if (!container.current) {
        return 0;
      }

      const x = shotX - WIDTH / 2;
      const minX = PADDING;
      const maxX = container.current.clientWidth - PADDING - WIDTH;

      return Math.max(minX, Math.min(maxX, x));
    },
    [container],
  );

  const getY = useCallback(
    (shotY: number) => {
      if (!container.current) {
        return 0;
      }

      const underY = shotY + PADDING;
      const overY = shotY - HEIGHT;

      const maxY = container.current.clientHeight - HEIGHT - PADDING;

      if (underY < maxY) {
        return underY;
      }

      return overY;
    },
    [container],
  );

  const position = useMemo(() => {
    if (shots == null || shots.totalShots === 0) {
      return { x: 0, y: 0 };
    }

    const x = getX(shots.position.x);
    const y = getY(shots.position.y);

    return { x, y };
  }, [getX, getY, shots]);

  const average = useMemo(() => {
    if (!hoveredShot || hoveredShot?.totalShots === 0) {
      return {
        totalShots: 0,
        madeShots: 0,
      };
    }

    return {
      totalShots: hoveredShot.totalShots,
      madeShots: hoveredShot.madeShots,
    };
  }, [hoveredShot]);

  const lastValidAverage = useLastValid(average, (a) => a.totalShots === 0);

  return (
    <AnimatePresence>
      {shots != null && (position.x !== 0 || position.y !== 0) && (
        <motion.div
          className={cn(
            'absolute rounded-md text-primary bg-white/80 border backdrop-blur-sm touch-none pointer-events-none z-20',
          )}
          initial={{
            opacity: 0,
            scale: 0.7,
            left: position.x,
            top: position.y,
            transition: { type: 'keyframes', duration: 2 },
          }}
          animate={{
            opacity: 1,
            scale: 1,
            left: position.x,
            top: position.y,
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
            width: `${WIDTH}px`,
            height: `${HEIGHT}px`,
          }}
        >
          <div className="w-full h-full px-4 py-2 flex flex-col justify-between">
            <div className="text-sm lowercase">
              <span className="font-bold">
                {formatter.bigNumber.format(
                  average.madeShots || lastValidAverage.madeShots,
                )}
                /
                {formatter.bigNumber.format(
                  average.totalShots || lastValidAverage.totalShots,
                )}
              </span>{' '}
              {t('basketball.stats.shots')}
            </div>

            <div className="text-sm">
              <span className="font-bold">
                {roundTo(
                  ((average.madeShots || lastValidAverage.madeShots) /
                    (average.totalShots || lastValidAverage.totalShots)) *
                    100,
                  1,
                )}
                %
              </span>{' '}
              FG%
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
