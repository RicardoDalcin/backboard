import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { motion, MotionProps } from 'motion/react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/welcome')({
  component: About,
});

function About() {
  const [, setHasOptedIn] = useLocalStorage('backboard.hasOptedIn', false);

  const router = useRouter();

  const animation = useCallback(
    (index: number): MotionProps => ({
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.2, delay: index * 0.1 },
    }),
    [],
  );

  const handleOptIn = useCallback(async () => {
    setHasOptedIn(true);
    await router.navigate({
      to: '/',
      replace: true,
    });
  }, [setHasOptedIn, router]);

  return (
    <div className="w-full h-full flex items-center justify-center flex-col gap-12 pb-[20vh]">
      <motion.h1 className="text-4xl font-semibold" {...animation(0)}>
        Welcome to Backboard!
      </motion.h1>

      <div className="max-w-xl text-justify flex items-center justify-center flex-col gap-4 text-muted-foreground">
        <motion.p className="text-lg" {...animation(1)}>
          Backboard in an offline-first data visualization dashboard for
          exploring, analyzing and comparing NBA shot data.
        </motion.p>

        <motion.p className="text-lg" {...animation(2)}>
          Since this is an offline-first experience, if you choose to continue
          the app will download the data and save it locally in your browser.
        </motion.p>

        <motion.p className="text-lg" {...animation(3)}>
          This process shouldn't take long, but please make sure you have a
          stable internet connection (download is about 150mb). You can delete
          the data at any time in the settings menu on the top right corner.
        </motion.p>
      </div>

      <motion.div {...animation(4)}>
        <Button onClick={handleOptIn}>Continue to the dashboard</Button>
      </motion.div>
    </div>
  );
}
