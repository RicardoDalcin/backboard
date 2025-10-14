import { HoverCallbackData } from '@/engine/Visualization';
import { cn } from '@/lib/utils';
import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';

const roundTo = (num: number, precision: number) => {
  return Math.round(num * 10 ** precision) / 10 ** precision;
};

function usePrevious<T>(value: T) {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState<T | null>(null);

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
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
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
  });

  const shots = useDebounce(
    hoveredShot,
    200,
    (s) => s?.every((s) => s.totalShots === 0) ?? false,
  );

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
    if (shots == null || shots.length === 0) {
      return { x: 0, y: 0 };
    }

    const maxX = Math.max(...shots.map((shot) => shot.position.x));
    const maxY = Math.max(...shots.map((shot) => shot.position.y));

    const x = getX(maxX);
    const y = getY(maxY);

    return { x, y };
  }, [getX, getY, shots]);

  const previousPosition = usePrevious(position);

  const average = useMemo(() => {
    if (hoveredShot?.length === 0) {
      return {
        totalShots: 0,
        madeShots: 0,
      };
    }

    const totalShots =
      hoveredShot?.reduce((acc, shot) => acc + shot.totalShots, 0) ?? 0;
    const madeShots =
      hoveredShot?.reduce((acc, shot) => acc + shot.madeShots, 0) ?? 0;

    return {
      totalShots,
      madeShots,
    };
  }, [hoveredShot]);

  return (
    <>
      {shots != null && (
        <div
          className={cn(
            'absolute rounded-md text-primary bg-white/80 border backdrop-blur-sm touch-none pointer-events-none z-20',
            [
              previousPosition &&
              previousPosition.x !== 0 &&
              previousPosition.y !== 0
                ? 'transition-all duration-50 ease-in-out'
                : 'transition-opacity duration-100',
            ],
          )}
          style={{
            width: `${WIDTH}px`,
            height: `${HEIGHT}px`,
            top: `${position.y}px`,
            left: `${position.x}px`,
            opacity: average.totalShots > 0 ? 1 : 0,
          }}
        >
          <div className="w-full h-full px-4 py-2 flex flex-col justify-between">
            <div className="text-sm">
              <span className="font-bold">
                {formatter.format(average.madeShots)}/
                {formatter.format(average.totalShots)}
              </span>{' '}
              shots
            </div>

            <div className="text-sm">
              <span className="font-bold">
                {roundTo((average.madeShots / average.totalShots) * 100, 1)}%
              </span>{' '}
              FG%
            </div>
          </div>
        </div>
      )}
    </>
  );
};
