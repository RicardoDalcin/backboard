import { HoverCallbackData } from '@/engine/Visualization';
import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';

const roundTo = (num: number, precision: number) => {
  return Math.round(num * 10 ** precision) / 10 ** precision;
};

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

function useLastNonNull<T>(
  value: T,
  isNull: (value: T) => boolean = (value) => value == null,
) {
  const [nonNullValue, setNonNullValue] = useState(value);

  useEffect(() => {
    if (!isNull(value)) {
      setNonNullValue(value);
      return;
    }
  }, [value, isNull]);

  return nonNullValue;
}

const WIDTH = 160;
const HEIGHT = 70;
const PADDING = 12;

export const CourtTooltip = ({
  shot: hoveredShot,
  container,
}: {
  shot: HoverCallbackData;
  container: RefObject<HTMLDivElement | null>;
}) => {
  const shot = useDebounce(hoveredShot, 200, (s) => s?.totalShots === 0);
  const nonNullShot = useLastNonNull(
    shot,
    (s) => s == null || s.totalShots === 0,
  );

  const getX = useCallback(
    (shot: NonNullable<HoverCallbackData>) => {
      if (!container.current) {
        return 0;
      }

      const x = shot.position.x - WIDTH / 2;
      const minX = PADDING;
      const maxX = container.current.clientWidth - PADDING - WIDTH;

      return Math.max(minX, Math.min(maxX, x));
    },
    [container],
  );

  const getY = useCallback(
    (shot: NonNullable<HoverCallbackData>) => {
      if (!container.current) {
        return 0;
      }

      const underY = shot.position.y + PADDING;
      const overY = shot.position.y - HEIGHT;

      const maxY = container.current.clientHeight - HEIGHT - PADDING;

      if (underY < maxY) {
        return underY;
      }

      return overY;
    },
    [container],
  );

  const position = useMemo(() => {
    if (!shot) {
      return { x: 0, y: 0 };
    }

    const x = getX(shot);
    const y = getY(shot);

    return { x, y };
  }, [getX, getY, shot]);

  return (
    <>
      {shot != null && (
        <div
          className="absolute rounded-md text-background bg-primary/60 touch-none pointer-events-none z-20 transition-all"
          style={{
            width: `${WIDTH}px`,
            height: `${HEIGHT}px`,
            top: `${position.y}px`,
            left: `${position.x}px`,
            opacity: shot && shot.totalShots > 0 ? 1 : 0,
          }}
        >
          {shot && nonNullShot && (
            <div className="w-full h-full px-4 py-2 flex flex-col justify-between">
              <div className="text-sm">
                <span className="font-bold">
                  {nonNullShot.madeShots}/{nonNullShot.totalShots}
                </span>{' '}
                shots
              </div>

              <div className="text-sm">
                <span className="font-bold">
                  {roundTo(
                    (nonNullShot.madeShots / nonNullShot.totalShots) * 100,
                    1,
                  )}
                  %
                </span>{' '}
                FG%
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
