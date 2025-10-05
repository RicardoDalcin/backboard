import { HoverCallbackData, VisualizationEngine } from '@/engine/Visualization';
import { useEffect, useRef, useState } from 'react';
import { CourtTooltip } from './court-tooltip';

export const Court = ({
  data,
  hoveredSection,
  onChangeHoveredSection = () => {},
}: {
  data: { locX: number; locY: number; totalShots: number; totalMade: number }[];
  hoveredSection?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null;
  onChangeHoveredSection?: (
    section: {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    } | null,
  ) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);
  const engine = useRef<VisualizationEngine | null>(null);

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
          onChangeHoveredSection(null);
          return;
        }

        if (data.length === 0) {
          return;
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const shot of data) {
          minX = Math.min(minX, shot.section.x);
          maxX = Math.max(maxX, shot.section.x);
          minY = Math.min(minY, shot.section.y);
          maxY = Math.max(maxY, shot.section.y);
        }

        onChangeHoveredSection({
          startX: minX,
          startY: minY,
          endX: maxX,
          endY: maxY,
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
  }, [onChangeHoveredSection]);

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

    const { x: startX, y: startY } = hoveringData?.[0]?.section ?? {
      x: 0,
      y: 0,
    };
    const { x: endX, y: endY } = hoveringData?.[hoveringData.length - 1]
      ?.section ?? {
      x: 0,
      y: 0,
    };

    if (
      (!hoveredSection && !hoveringData) ||
      (hoveredSection &&
        hoveringData &&
        hoveredSection.startX === startX &&
        hoveredSection.startY === startY &&
        hoveredSection.endX === endX &&
        hoveredSection.endY === endY)
    ) {
      return;
    }

    engine.current.setHoveredShot(hoveredSection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredSection]);

  return (
    <div ref={containerRef} className="w-full h-min relative">
      <canvas ref={canvasRef} className="rounded-xl"></canvas>

      <CourtTooltip shots={hoveringData} container={containerRef} />
    </div>
  );
};
