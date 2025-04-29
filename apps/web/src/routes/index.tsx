import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/server/db';
import { Loader } from './-components/loader';
import { Button } from '@/components/ui/button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { Card } from '@/components/ui/card';
import { Filters } from './-components/filters';
import { Skeleton } from '@/components/ui/skeleton';
import { useStats } from '@/stores/stats';

export const Route = createFileRoute('/')({
  component: Index,
  loader: () => db.load(),
  pendingComponent: Loader,
});

function Index() {
  const { data, isLoading } = useStats();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-3xl font-bold">Explore</h2>

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
          <Card className="col-span-12 h-[600px] xl:col-span-7 py-0 overflow-hidden">
            <Skeleton className="w-full h-full" />
          </Card>
          <Card className="col-span-12 h-[600px] xl:col-span-5 py-0 overflow-hidden">
            <Skeleton className="w-full h-full" />
          </Card>

          <Card className="col-span-12 h-[600px] xl:col-span-5 py-0 overflow-hidden">
            <Skeleton className="w-full h-full" />
          </Card>
          <Card className="col-span-12 h-[600px] xl:col-span-7 py-0 overflow-hidden">
            <Skeleton className="w-full h-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
