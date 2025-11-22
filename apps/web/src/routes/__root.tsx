import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartSyncProvider } from '@/stores/chart-sync';
import { FiltersProvider } from '@/stores/filters';
import { StatsProvider } from '@/stores/stats';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import {
  createRootRoute,
  Link,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { SettingsDialog } from './-components/settings-dialog';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormatterProvider } from '@/stores/formatter';

function Root() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { t } = useTranslation();

  return (
    <FormatterProvider>
      <ChartSyncProvider>
        <FiltersProvider>
          <StatsProvider>
            <main className="min-h-screen w-screen h-max overflow-x-hidden [--nav-height:72px]">
              <header className="fixed z-50 w-full h-[var(--nav-height)] bg-background/80 backdrop-blur-sm flex items-center justify-between px-8 border-b border-border">
                <div className="flex items-center justify-center gap-12 h-full">
                  <div className="flex items-center gap-3 h-full text-foreground">
                    <Logo className="size-8" />
                    <h1 className="text-base font-medium">backboard</h1>
                  </div>

                  <nav className="flex items-center px-6 gap-6">
                    <Link
                      to="/"
                      className="[&.active]:text-foreground text-muted-foreground font-medium text-sm"
                    >
                      {t('menu.explore')}
                    </Link>

                    <Link
                      to="/compare"
                      className="[&.active]:text-foreground text-muted-foreground font-medium text-sm"
                    >
                      {t('menu.compare')}
                    </Link>

                    <Link
                      to="/about"
                      className="[&.active]:text-foreground text-muted-foreground font-medium text-sm"
                    >
                      {t('menu.about')}
                    </Link>
                  </nav>
                </div>

                <div className="flex justify-end items-center h-full">
                  <Button variant="ghost" className="size-10" asChild>
                    <a
                      href="https://github.com/RicardoDalcin/nba-viz"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg
                        className="size-6"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 22V18C15.1392 16.7473 14.78 15.4901 14 14.5C17 14.5 20 12.5 20 9C20.08 7.75 19.73 6.52 19 5.5C19.28 4.35 19.28 3.15 19 2C19 2 18 2 16 3.5C13.36 3 10.64 3 8.00004 3.5C6.00004 2 5.00004 2 5.00004 2C4.70004 3.15 4.70004 4.35 5.00004 5.5C4.27191 6.51588 3.91851 7.75279 4.00004 9C4.00004 12.5 7.00004 14.5 10 14.5C9.61004 14.99 9.32004 15.55 9.15004 16.15C8.98004 16.75 8.93004 17.38 9.00004 18M9.00004 18V22M9.00004 18C4.49004 20 4 16 2 16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </Button>

                  <SettingsDialog
                    isOpen={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                  >
                    <Button variant="ghost" className="size-10">
                      <Cog6ToothIcon className="size-6" />
                    </Button>
                  </SettingsDialog>
                </div>
              </header>

              <ScrollArea className="w-screen h-screen">
                <div className="flex min-h-screen w-screen pt-[var(--nav-height)]">
                  <section className="px-8 pt-4 pb-8 flex-1 w-full flex">
                    <Outlet />

                    <TanStackRouterDevtools />
                  </section>
                </div>
              </ScrollArea>
            </main>
          </StatsProvider>
        </FiltersProvider>
      </ChartSyncProvider>
    </FormatterProvider>
  );
}

export const Route = createRootRoute({
  component: Root,
  beforeLoad: (ctx) => {
    const searchParams = new URLSearchParams(ctx.location.search ?? '');
    const filter = searchParams.get('filter') as string;
    if (filter) {
      window.localStorage.setItem('backboard.sharedFilter', filter);
    }

    const hasOptedIn =
      typeof window !== 'undefined'
        ? JSON.parse(
            window.localStorage.getItem('backboard.hasOptedIn') || 'false',
          )
        : false;

    const isWelcome = ctx.location.pathname === '/welcome';

    if (!hasOptedIn && !isWelcome) {
      throw redirect({ to: '/welcome' });
    }

    if ((hasOptedIn && isWelcome) || filter) {
      throw redirect({ to: '/' });
    }
  },
});
