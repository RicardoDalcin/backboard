import { Progress } from '@/components/ui/progress';
import { db } from '@/server/db';
import { useEffect, useState } from 'react';

export const Loader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = db.subscribeLoadProgress((newProgress) => {
      setProgress(newProgress * 100);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center pb-20">
      <div className="flex flex-col justify-center items-center gap-8 max-w-[300px] w-full">
        <div className="loader infinite-color-animation"></div>
        <Progress value={progress} />
      </div>
    </div>
  );
};
