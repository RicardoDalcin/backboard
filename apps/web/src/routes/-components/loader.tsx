import { Progress } from '@/components/ui/progress';
import { db } from '@/server/db';
import { useEffect, useMemo, useState } from 'react';

export const Loader = () => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'downloading' | 'initializing'>(
    'downloading',
  );

  useEffect(() => {
    const unsubscribes = [
      db.subscribeLoadProgress((newProgress) => {
        setProgress(newProgress * 100);
      }),
      db.subscribeLoadPhase((newPhase) => {
        setPhase(newPhase);
      }),
    ];

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, []);

  const phaseText = useMemo(() => {
    if (phase === 'downloading') {
      return 'Downloading data...';
    }

    return 'Initializing dashboard...';
  }, [phase]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col items-center justify-center pb-20">
      <div className="flex flex-col justify-center items-center gap-8 max-w-[300px] w-full">
        <div className="loader infinite-color-animation"></div>

        <div className="flex flex-col gap-4 w-full items-center">
          <Progress value={progress} />
          <p className="text-sm text-primary/50">{phaseText}</p>
        </div>
      </div>
    </div>
  );
};
