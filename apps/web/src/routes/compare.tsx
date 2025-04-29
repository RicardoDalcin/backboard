import { db } from '@/server/db';
import { createFileRoute } from '@tanstack/react-router';
import { Loader } from './-components/loader';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/solid';
import { Card } from '@/components/ui/card';

export const Route = createFileRoute('/compare')({
  component: RouteComponent,
  loader: () => db.load(),
  pendingComponent: Loader,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-3xl font-bold">Compare</h2>

        <div className="flex items-center gap-4">
          <Button>
            <PlusIcon className="size-4" /> Export
          </Button>
        </div>
      </div>

      <div className="flex gap-6 h-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card
            key={i}
            className="flex-1 flex flex-col items-center justify-center px-4 pt-4 pb-[164px] text-zinc-400 gap-6 h-full"
          >
            <svg
              width="64"
              height="65"
              viewBox="0 0 64 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 19.242V13.9087C8 12.4942 8.5619 11.1377 9.5621 10.1375C10.5623 9.13728 11.9188 8.57538 13.3333 8.57538H18.6667M45.3333 8.57538H50.6667C52.0812 8.57538 53.4377 9.13728 54.4379 10.1375C55.4381 11.1377 56 12.4942 56 13.9087V19.242M56 45.9087V51.242C56 52.6565 55.4381 54.0131 54.4379 55.0133C53.4377 56.0135 52.0812 56.5754 50.6667 56.5754H45.3333M18.6667 56.5754H13.3333C11.9188 56.5754 10.5623 56.0135 9.5621 55.0133C8.5619 54.0131 8 52.6565 8 51.242V45.9087M42.6669 43.2423L37.6003 38.1756M40 32.5754C40 36.9937 36.4183 40.5754 32 40.5754C27.5817 40.5754 24 36.9937 24 32.5754C24 28.1571 27.5817 24.5754 32 24.5754C36.4183 24.5754 40 28.1571 40 32.5754Z"
                stroke="currentColor"
                strokeWidth="5.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <p className="text-sm font-medium text-zinc-600 max-w-[185px] text-center">
              No filter selected. Use a preset to continue.
            </p>

            <div className="flex flex-col gap-3">
              <Button>
                Select preset <ChevronDownIcon className="size-4" />
              </Button>

              <Button variant="outline">Close panel</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
