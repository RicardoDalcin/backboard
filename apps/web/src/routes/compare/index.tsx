import { db } from '@/server/db';
import { createFileRoute } from '@tanstack/react-router';
import { Loader } from '../-components/loader';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/solid';
import { Card } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFilters } from '@/stores/filters';
import { FilterPanel } from './-components/FilterPanel';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/compare/')({
  component: RouteComponent,
  loader: () => db.load(),
  pendingComponent: Loader,
});

function RouteComponent() {
  const { filters } = useFilters();
  const { t } = useTranslation();

  const [panels, setPanels] = useLocalStorage(
    'backboard.compare.panels',
    [
      {
        id: 1,
        filterId: null,
      },
      {
        id: 2,
        filterId: null,
      },
    ] as Array<{
      id: number;
      filterId: number | null;
    }>,
    (value) => value.length >= 2,
  );

  function addPanel() {
    const maxId = Math.max(...panels.map((p) => p.id));

    setPanels([
      ...panels,
      {
        id: maxId + 1,
        filterId: null,
      },
    ]);
  }

  function removePanel(id: number) {
    setPanels(panels.filter((p) => p.id !== id));
  }

  function selectPanelFilter(panelId: number, filterId: number) {
    setPanels(panels.map((p) => (p.id === panelId ? { ...p, filterId } : p)));
  }

  const panelsWithFilters = useMemo(
    () =>
      panels.map((panel) => ({
        ...panel,
        filter:
          panel.filterId != null
            ? filters.find((f) => f.id === panel.filterId)
            : null,
      })),
    [panels, filters],
  );

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-3xl font-bold">{t('compare.title')}</h2>

        <div className="flex items-center gap-4">
          <Button onClick={addPanel}>
            <PlusIcon className="size-4" /> {t('compare.addPanel')}
          </Button>
        </div>
      </div>

      <div className="flex gap-6 h-full items-center overflow-auto -mx-8 px-8">
        {panelsWithFilters.map((panel) => (
          <Card
            key={panel.id}
            className="w-full h-full !py-0 min-w-[350px] max-w-[450px]"
          >
            {!panel.filter ? (
              <div className="h-full flex flex-col items-center gap-6 px-4 pt-[164px] pb-4">
                <svg
                  width="64"
                  height="65"
                  viewBox="0 0 64 65"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-zinc-400"
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
                  {t('compare.panel.noFilterSelected')}
                </p>

                <div className="flex flex-col gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        {t('compare.panel.selectPreset')}
                        <ChevronDownIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-[220px]" align="start">
                      {filters.map((filter) => (
                        <DropdownMenuItem
                          key={filter.id}
                          onClick={() => selectPanelFilter(panel.id, filter.id)}
                        >
                          {filter.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {panels.length > 2 && (
                    <Button
                      variant="outline"
                      onClick={() => removePanel(panel.id)}
                    >
                      {t('compare.panel.closePanel')}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <FilterPanel
                filter={panel.filter}
                onChangeFilter={(id) => selectPanelFilter(panel.id, id)}
                canRemovePanel={panels.length > 2}
                onClosePanel={() => removePanel(panel.id)}
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
