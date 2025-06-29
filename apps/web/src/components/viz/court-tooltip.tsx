import { HoverCallbackData } from '@/engine/Visualization';
import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (value != null) {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, debouncedValue]);

  return debouncedValue;
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
  const shot = useDebounce(hoveredShot, 500);

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
        {shot && (
          <div className="w-full h-full px-4 py-2 flex flex-col gap-2">
            {shot.madeShots}/{shot.totalShots} shots
          </div>
        )}
      </div>
    </>
  );
};
