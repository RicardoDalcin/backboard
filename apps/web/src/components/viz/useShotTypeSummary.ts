import { ClockSummary, Shot, ShotType } from '@/types';
import { useMemo } from 'react';

export function useShotTypeSummary(
  data: Pick<Shot, 'shotMade' | 'shotType' | 'quarter' | 'minsLeft'>[],
) {
  const shotTypeSummary = useMemo(() => {
    const clocks3pt = new Map<number, ClockSummary>();
    const clocks2pt = new Map<number, ClockSummary>();

    if (!data) {
      return {
        twos: [],
        threes: [],
      };
    }

    for (const shot of data) {
      const gameMinute = (shot.quarter - 1) * 12 + (12 - shot.minsLeft);
      const map =
        shot.shotType === ShotType.ThreePointer ? clocks3pt : clocks2pt;

      if (!map.has(gameMinute)) {
        map.set(gameMinute, {
          id: gameMinute,
          count: 0,
          totalMade: 0,
          totalMissed: 0,
          accuracy: 0,
          frequency: 0,
        });
      }

      const zoneItem = map.get(gameMinute)!;

      zoneItem.count++;

      if (shot.shotMade) {
        zoneItem.totalMade++;
      } else {
        zoneItem.totalMissed++;
      }
    }

    clocks2pt.forEach((zone) => {
      zone.accuracy = zone.totalMade / zone.count;
      zone.frequency = zone.count / data.length;
    });

    clocks3pt.forEach((zone) => {
      zone.accuracy = zone.totalMade / zone.count;
      zone.frequency = zone.count / data.length;
    });

    return {
      twos: Array.from(clocks2pt.values()).sort((a, b) => a.id - b.id),
      threes: Array.from(clocks3pt.values()).sort((a, b) => a.id - b.id),
    };
  }, [data]);

  return { shotTypeSummary };
}
