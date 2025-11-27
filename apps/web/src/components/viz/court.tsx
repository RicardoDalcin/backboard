import {
  HoverCallbackData,
  SHOT_COLORS,
  VisualizationEngine,
} from '@/engine/Visualization';
import { useEffect, useRef, useState } from 'react';
import { CourtTooltip } from './court-tooltip';
import { useAtom } from 'jotai';
import { atom } from 'jotai';
import { regionSync } from '@/stores/chart-sync';
import { BASIC_ZONES } from '@nba-viz/data';
import { useTranslation } from 'react-i18next';
import { Filter } from '@/types/filters';

const hoveredSectionAtom = atom<{
  startX: number;
  startY: number;
  endX: number;
  endY: number;
} | null>(null);

export const Court = ({
  data,
  filter,
}: {
  data: { locX: number; locY: number; totalShots: number; totalMade: number }[];
  filter: Filter;
}) => {
  const [activeIndex] = useAtom(regionSync);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);
  const engine = useRef<VisualizationEngine | null>(null);
  const [hoveredSection, setHoveredSection] = useAtom(hoveredSectionAtom);
  const [hoveringData, setHoveringData] = useState<HoverCallbackData>(null);
  const { t } = useTranslation();
  const isMouseOver = useRef(false);
  const abortController = useRef(new AbortController());

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container || initialized.current) {
      return;
    }

    if (engine.current) {
      engine.current.destroy();
      abortController.current.abort();
    }

    abortController.current = new AbortController();

    engine.current = new VisualizationEngine(canvas, container, {
      onHover: (data, passive) => {
        setHoveringData(data);

        if (passive) {
          return;
        }

        if (!data) {
          setHoveredSection(null);
          return;
        }

        if (data.totalShots === 0) {
          return;
        }

        setHoveredSection(data.section);
      },
    });
    initialized.current = true;

    canvas.addEventListener(
      'mouseover',
      () => {
        isMouseOver.current = true;
      },
      { signal: abortController.current.signal },
    );

    canvas.addEventListener(
      'mouseleave',
      () => {
        isMouseOver.current = false;
      },
      { signal: abortController.current.signal },
    );
  }, [setHoveredSection]);

  useEffect(() => {
    if (!engine.current) {
      return;
    }

    engine.current.setShotData(data, {
      min: filter.season[0],
      max: filter.season[1],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (!engine.current) {
      return;
    }

    engine.current.setSeasonRange(filter.season[0], filter.season[1]);
  }, [filter]);

  useEffect(() => {
    if (
      !engine.current ||
      hoveredSection === undefined ||
      isMouseOver.current
    ) {
      return;
    }

    engine.current.setHoveredShot(hoveredSection);
  }, [hoveredSection]);

  useEffect(() => {
    if (!activeIndex) {
      engine.current?.highlightZone(null);
      return;
    }

    const zoneId = Object.keys(BASIC_ZONES).find(
      (key) => BASIC_ZONES[key as keyof typeof BASIC_ZONES] === activeIndex,
    );

    if (!zoneId) {
      return;
    }

    engine.current?.highlightZone(zoneId as keyof typeof BASIC_ZONES);
  }, [activeIndex]);

  return (
    <div ref={containerRef} className="w-full h-min relative @container">
      <canvas ref={canvasRef}></canvas>

      <CourtTooltip shots={hoveringData} container={containerRef} />

      <div className="w-full flex items-center justify-between @xl:px-4 px-2 pb-1">
        <div className="flex flex-col gap-0.5">
          <div className="@xl:h-4 h-3 flex items-center @xl:text-[10px] text-[8px] text-white">
            <div
              className="@xl:w-7 w-5 h-full flex items-center justify-center"
              style={{ background: SHOT_COLORS.badEnd }}
            >
              -10%
            </div>
            <div
              className="@xl:w-7 w-5 h-full flex items-center justify-center"
              style={{ background: SHOT_COLORS.badStart }}
            >
              -3%
            </div>
            <div
              className="@xl:w-7 w-5 h-full flex items-center justify-center"
              style={{ background: SHOT_COLORS.base }}
            ></div>
            <div
              className="@xl:w-7 w-5 h-full flex items-center justify-center"
              style={{ background: SHOT_COLORS.goodStart }}
            >
              +3%
            </div>
            <div
              className="@xl:w-7 w-5 h-full flex items-center justify-center"
              style={{ background: SHOT_COLORS.goodEnd }}
            >
              +10%
            </div>
          </div>

          <p className="opacity-60 @xl:text-xs text-[10px]">
            {t('explore.fgVsLeagueAverage')}
          </p>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <div className="@xl:h-4 h-3 flex items-center text-white @xl:gap-2 gap-1.5">
            <div className="bg-zinc-800 @xl:size-[5px] size-[3px]"></div>
            <div className="bg-zinc-800 @xl:size-[7px] size-[5px]"></div>
            <div className="bg-zinc-800 @xl:size-[9px] size-[7px]"></div>
            <div className="bg-zinc-800 @xl:size-[11px] size-[9px]"></div>
            <div className="bg-zinc-800 @xl:size-[13px] size-[11px]"></div>
          </div>

          <p className="opacity-60 @xl:text-xs text-[10px]">
            {t('explore.volumeLowToHigh')}
          </p>
        </div>
      </div>
    </div>
  );
};
