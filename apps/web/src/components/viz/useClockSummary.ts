import { ClockSummary, Shot } from '@/types';
import { useMemo } from 'react';

export function useClockSummary(
  data: Pick<Shot, 'shotMade' | 'quarter' | 'minsLeft'>[],
) {
  const clockSummary = useMemo(() => {
    const clocks = new Map<number, ClockSummary>();

    if (!data) {
      return [];
    }

    for (const shot of data) {
      const gameMinute = (shot.quarter - 1) * 12 + (12 - shot.minsLeft);

      if (!clocks.has(gameMinute)) {
        clocks.set(gameMinute, {
          id: gameMinute,
          count: 0,
          totalMade: 0,
          totalMissed: 0,
          accuracy: 0,
          frequency: 0,
        });
      }

      const zoneItem = clocks.get(gameMinute)!;

      zoneItem.count++;

      if (shot.shotMade) {
        zoneItem.totalMade++;
      } else {
        zoneItem.totalMissed++;
      }
    }

    clocks.forEach((zone) => {
      zone.accuracy = zone.totalMade / zone.count;
      zone.frequency = zone.count / data.length;
    });

    return Array.from(clocks.values()).sort((a, b) => a.id - b.id);
  }, [data]);

  return { clockSummary };
}
