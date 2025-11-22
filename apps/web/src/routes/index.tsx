import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/server/db';
import { Loader } from './-components/loader';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, ShareIcon } from '@heroicons/react/24/solid';
import { Card } from '@/components/ui/card';
import { Filters } from './-components/filters';
import { Skeleton } from '@/components/ui/skeleton';
import { useStats } from '@/stores/stats';
import { Court } from '@/components/viz/court';
import { ShotRegionChart } from '@/components/viz/shot-region-chart';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { useRef, useState } from 'react';
import { useFilters } from '@/stores/filters';
import { PlayerScatterplot } from '@/components/viz/player-scatterplot';
import { TeamScatterplot } from '@/components/viz/team-scatterplot';

export const Route = createFileRoute('/')({
  component: Index,
  loader: () => db.load(),
  pendingComponent: Loader,
});

function Index() {
  const { courtShotData, isLoading, statSummary, statsByPlayer, statsByTeam } =
    useStats();
  const { getShareableUrl } = useFilters();
  const { t } = useTranslation();

  const totalShots = courtShotData.reduce(
    (acc, shot) => acc + shot.totalShots,
    0,
  );

  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const timeout = useRef<NodeJS.Timeout | null>(null);
  function onShare() {
    const url = getShareableUrl();
    if (!url) {
      return;
    }

    navigator.clipboard.writeText(url);
    setShowCopySuccess(true);

    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }

    timeout.current = setTimeout(() => {
      setShowCopySuccess(false);
      timeout.current = null;
    }, 2000);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-3xl font-bold">
          {isLoading
            ? t('explore.loadingShots')
            : t('explore.exploringShots', { count: totalShots })}
        </h2>

        <div className="flex items-center gap-4">
          <Button className="w-[140px]" onClick={onShare}>
            <div className="relative size-4">
              <AnimatePresence mode="popLayout">
                {showCopySuccess ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.6, filter: 'blur(2px)', opacity: 0 }}
                    animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
                    exit={{ scale: 0.6, filter: 'blur(2px)', opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CheckCircleIcon className="size-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="share"
                    initial={{ scale: 0.6, filter: 'blur(2px)', opacity: 0 }}
                    animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
                    exit={{ scale: 0.6, filter: 'blur(2px)', opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ShareIcon className="size-4" onClick={onShare} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="popLayout">
              {showCopySuccess ? (
                <motion.div
                  key="check"
                  initial={{ filter: 'blur(2px)', opacity: 0 }}
                  animate={{ filter: 'blur(0px)', opacity: 1 }}
                  exit={{ filter: 'blur(2px)', opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {t('global.copiedLink')}
                </motion.div>
              ) : (
                <motion.div
                  key="share"
                  initial={{ filter: 'blur(2px)', opacity: 0 }}
                  animate={{ filter: 'blur(0px)', opacity: 1 }}
                  exit={{ filter: 'blur(2px)', opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {t('global.share')}
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <Filters />

        <div className="grid grid-cols-12 gap-6 flex-1 h-min">
          <Card className="col-span-12 xl:col-span-7 xl:h-min xl:min-h-full py-0">
            {isLoading ? (
              <Skeleton className="w-full aspect-[541/406.83] !rounded-xl" />
            ) : (
              <Court data={courtShotData} />
            )}
          </Card>

          <Card className="@container col-span-12 xl:col-span-5 xl:h-min xl:min-h-full py-0">
            {isLoading ? (
              <Skeleton className="w-full h-full aspect-[90/100] !rounded-xl" />
            ) : (
              <div className="pt-8 px-4">
                <ShotRegionChart data={statSummary} />
              </div>
            )}
          </Card>

          <Card className="@container col-span-12 xl:col-span-6 xl:h-min xl:min-h-full py-0">
            {isLoading ? (
              <Skeleton className="w-full h-full aspect-[90/100] !rounded-xl" />
            ) : (
              <div>
                <PlayerScatterplot data={statsByPlayer} />
              </div>
            )}
          </Card>

          <Card className="@container col-span-12 xl:col-span-6 xl:h-min xl:min-h-full py-0 overflow-x-auto">
            {isLoading ? (
              <Skeleton className="w-full h-full aspect-[90/100] !rounded-xl" />
            ) : (
              <div>
                <TeamScatterplot data={statsByTeam} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
