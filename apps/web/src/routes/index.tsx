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

export const Route = createFileRoute('/')({
  component: Index,
  loader: () => db.load(),
  pendingComponent: Loader,
});

function Index() {
  const { courtShotData, isLoading } = useStats();

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const totalShots = courtShotData.reduce(
    (acc, shot) => acc + shot.totalShots,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-3xl font-bold">
          {isLoading
            ? `Loading shots...`
            : `Exploring ${formatter.format(totalShots)} shots`}
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
              <Court data={courtShotData} />
            )}
          </Card>

          {/* <Card className="col-span-12 xl:col-span-5 py-0 overflow-hidden">
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
          </Card> */}

          <Card className="col-span-12 h-[600px] xl:col-span-7 py-0 overflow-hidden">
            <Skeleton className="w-full h-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
