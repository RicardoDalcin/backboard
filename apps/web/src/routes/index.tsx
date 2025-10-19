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

        <div className="grid grid-cols-12 gap-6 flex-1">
          <Card className="col-span-12 xl:col-span-7 xl:h-min py-0">
            {isLoading ? (
              <Skeleton className="w-full aspect-[541/406.83] rounded-xl" />
            ) : (
              <Court data={courtShotData} />
            )}
          </Card>

          <Card className="@container col-span-12 xl:col-span-5 xl:h-min py-0 px-4">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <div className="pt-8">
                <ShotRegionChart data={statSummary} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
