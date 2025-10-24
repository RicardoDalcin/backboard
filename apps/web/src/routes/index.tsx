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
import { ShotRegionChart } from '@/components/viz/shot-region-chart';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { BASIC_ZONES, ZONE_LOCATIONS } from '@nba-viz/data';

export const Route = createFileRoute('/')({
  component: Index,
  loader: () => db.load(),
  pendingComponent: Loader,
});

function Index() {
  const { courtShotData, isLoading, statSummary } = useStats();
  const { t } = useTranslation();

  const totalShots = courtShotData.reduce(
    (acc, shot) => acc + shot.totalShots,
    0,
  );

  const [gameMinute, setGameMinute] = useState(0);
  const shotData = useMemo(() => {
    const quarter = Math.floor(gameMinute / 12) + 1;
    const minsLeft = 12 - (gameMinute % 12) - 1;
    return courtShotData.filter((shot) => {
      return shot.quarter === quarter && shot.minsLeft === minsLeft;
    });
  }, [gameMinute, courtShotData]);

  type ParseInt<T> = T extends `${infer N extends number}` ? N : never;

  const regionSummary = Object.keys(BASIC_ZONES).map((key) => {
    const locations = ZONE_LOCATIONS[key as keyof typeof ZONE_LOCATIONS];
    const summary = locations.reduce(
      (acc, location) => {
        const shotLocation = shotData.find(
          (shot) => shot.locX + 25 === location.x && shot.locY === location.y,
        );

        if (!shotLocation) {
          return acc;
        }

        return {
          totalShots: acc.totalShots + shotLocation.totalShots,
          totalMade: acc.totalMade + shotLocation.totalMade,
        };
      },
      { totalShots: 0, totalMade: 0 },
    );
    return {
      basicZone: Number(key) as ParseInt<keyof typeof BASIC_ZONES>,
      totalShots: summary.totalShots,
      totalMade: summary.totalMade,
    };
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-3xl font-bold">
          {isLoading
            ? t('explore.loadingShots')
            : t('explore.exploringShots', { count: totalShots })}
        </h2>

        <div className="flex items-center gap-4">
          <Button variant="outline">{t('global.share')}</Button>

          <Button>
            <ArrowDownTrayIcon className="size-4" /> {t('global.export')}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <Filters />

        <div className="grid grid-cols-12 gap-6 flex-1 h-min">
          <Card className="col-span-12 xl:col-span-7 xl:h-min py-0 overflow-hidden">
            {isLoading ? (
              <Skeleton className="w-full aspect-[541/406.83] !rounded-xl" />
            ) : (
              <Court data={shotData} />
            )}

            <div className="flex items-center gap-2">
              {gameMinute}
              <Button
                variant="outline"
                onClick={() => setGameMinute(gameMinute + 1)}
              >
                <ArrowRightIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setGameMinute(gameMinute - 1)}
              >
                <ArrowLeftIcon className="size-4" />
              </Button>
            </div>
          </Card>

          <Card className="@container col-span-12 xl:col-span-5 xl:h-min py-0">
            {isLoading ? (
              <Skeleton className="w-full h-full aspect-[90/100] !rounded-xl" />
            ) : (
              <div className="pt-8 px-4">
                <ShotRegionChart data={regionSummary} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
