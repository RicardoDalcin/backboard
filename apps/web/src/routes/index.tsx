import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/server/db';
import { Loader } from './-components/loader';
import { Button } from '@/components/ui/button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { Card } from '@/components/ui/card';
import { Filters } from './-components/filters';
import { Skeleton } from '@/components/ui/skeleton';
import { useStats } from '@/stores/stats';
import { Court } from '@/components/viz/court';
import { ClockSummary, ShotType } from '@/types';
import { useMemo } from 'react';
import { ClockAreaChart } from '@/components/viz/clock-area-chart';
import { ShotTypeLineChart } from '@/components/viz/shot-type-line-chart';

export const Route = createFileRoute('/')({
  component: Index,
  loader: () => db.load(),
  pendingComponent: Loader,
});

function Index() {
  const { data, isLoading } = useStats();

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

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

    console.log(clocks2pt);

    return {
      twos: Array.from(clocks2pt.values()).sort((a, b) => a.id - b.id),
      threes: Array.from(clocks3pt.values()).sort((a, b) => a.id - b.id),
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-3xl font-bold">
          {isLoading
            ? `Loading shots...`
            : `Exploring ${formatter.format(data.length)} shots`}
        </h2>

        <div className="flex items-center gap-4">
          <Button variant="outline">Share</Button>

          <Button>
            <ArrowDownTrayIcon className="size-4" /> Export
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <Filters />

        <div className="grid grid-cols-12 gap-6 flex-1">
          <Card className="col-span-12 xl:col-span-7 py-0">
            {isLoading ? (
              <Skeleton className="w-full aspect-[541/406.83] rounded-xl" />
            ) : (
              <Court shots={data} />
            )}
          </Card>

          <Card className="col-span-12 xl:col-span-5 py-0 overflow-hidden">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <div className="py-4 px-4 size-full">
                <ClockAreaChart data={clockSummary} />
              </div>
            )}
          </Card>

          <Card className="col-span-12 h-[600px] xl:col-span-5 py-0 overflow-hidden">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <div className="py-4 px-4 size-full">
                <ShotTypeLineChart data={shotTypeSummary} />
              </div>
            )}
          </Card>

          <Card className="col-span-12 h-[600px] xl:col-span-7 py-0 overflow-hidden">
            <Skeleton className="w-full h-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
