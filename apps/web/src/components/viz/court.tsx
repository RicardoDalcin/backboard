import { HoverCallbackData, VisualizationEngine } from '@/engine/Visualization';
import { useEffect, useRef, useState } from 'react';
import { CourtTooltip } from './court-tooltip';
import { useAtom } from 'jotai';
import { atom } from 'jotai';
import { regionSync } from '@/stores/chart-sync';
import { BASIC_ZONES } from '@nba-viz/data';

const hoveredSectionAtom = atom<{
  startX: number;
  startY: number;
  endX: number;
  endY: number;
} | null>(null);

export const Court = ({
  data,
}: {
  data: { locX: number; locY: number; totalShots: number; totalMade: number }[];
}) => {
  const [activeIndex] = useAtom(regionSync);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);
  const engine = useRef<VisualizationEngine | null>(null);
  const [hoveredSection, setHoveredSection] = useAtom(hoveredSectionAtom);

  const [hoveringData, setHoveringData] = useState<HoverCallbackData>(null);

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
      onHover: (data) => {
        setHoveringData(data);

        if (!isMouseOver.current) {
          return;
        }

        if (!data) {
          setHoveredSection(null);
          return;
        }

        if (data.totalShots === 0) {
          return;
        }

        const { x: startX, y: startY } = data.position;
        const { x: endX, y: endY } = data.position;

        setHoveredSection({
          startX,
          startY,
          endX,
          endY,
        });
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

    engine.current.setShotData(data);
  }, [data]);

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
    <div ref={containerRef} className="w-full h-min relative">
      <canvas ref={canvasRef} className="rounded-xl"></canvas>

      <CourtTooltip shots={hoveringData} container={containerRef} />
    </div>
  );
};
