import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { motion, MotionProps } from 'motion/react';
import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/welcome')({
  component: About,
});

function About() {
  const [, setHasOptedIn] = useLocalStorage('backboard.hasOptedIn', false);

  const { t } = useTranslation();
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

  const isSupported = useMemo(() => {
    return 'storage' in navigator && 'getDirectory' in navigator.storage;
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center flex-col gap-12 pb-[20vh]">
      {isSupported ? (
        <>
          <motion.h1 className="text-4xl font-semibold" {...animation(0)}>
            {t('welcome.title')}
          </motion.h1>

          <div className="max-w-xl text-justify flex items-center justify-center flex-col gap-4 text-muted-foreground">
            <motion.p className="text-lg" {...animation(1)}>
              {t('welcome.aboutBackboard')}
            </motion.p>

            <motion.p className="text-lg" {...animation(2)}>
              {t('welcome.offlineFirst')}
            </motion.p>

            <motion.p className="text-lg" {...animation(3)}>
              {t('welcome.connectionDisclaimer')}
            </motion.p>
          </div>

          <motion.div {...animation(4)}>
            <Button onClick={handleOptIn}>{t('welcome.continue')}</Button>
          </motion.div>
        </>
      ) : (
        <>
          <motion.h1 className="text-2xl font-semibold" {...animation(0)}>
            {t('welcome.notSupported.title')}
          </motion.h1>

          <div className="max-w-xl text-justify flex items-center justify-center flex-col gap-6 text-muted-foreground">
            <motion.p className="text-lg" {...animation(1)}>
              {t('welcome.notSupported.description')}
            </motion.p>

            <div className="flex flex-col gap-2 w-full">
              <motion.p {...animation(1)}>
                {t('welcome.notSupported.minimumRequisites')}:
              </motion.p>

              <div className="flex flex-wrap gap-3 text-left w-full">
                <p>
                  <strong className="font-semibold">Chrome</strong> 86+
                </p>
                <p>
                  <strong className="font-semibold">Edge</strong> 86+
                </p>
                <p>
                  <strong className="font-semibold">Firefox</strong> 111+
                </p>
                <p>
                  <strong className="font-semibold">Opera</strong> 72+
                </p>
                <p>
                  <strong className="font-semibold">Safari</strong> 15.2+
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
