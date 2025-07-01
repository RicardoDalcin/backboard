import { HoverCallbackData, VisualizationEngine } from '@/engine/Visualization';
import { Shot } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { CourtTooltip } from './court-tooltip';

export const Court = ({
  shots,
  hoveredSection,
  onChangeHoveredSection = () => {},
}: {
  shots: Pick<Shot, 'locX' | 'locY' | 'shotMade'>[];
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container || initialized.current) {
      return;
    }

    if (engine.current) {
      engine.current.destroy();
    }

    engine.current = new VisualizationEngine(canvas, container, {
      onHover: (data) => {
        setHoveringData(data);

        if (!data) {
          onChangeHoveredSection(null);
          return;
        }

        if (data.length === 0) {
          return;
        }

        if (data.length === 1) {
          const { x, y } = data[0]?.section ?? { x: 0, y: 0 };
          onChangeHoveredSection({
            startX: x,
            startY: y,
            endX: x,
            endY: y,
          });
          return;
        }

        const { x: startX, y: startY } = data[0]?.section ?? { x: 0, y: 0 };
        const { x: endX, y: endY } = data[data.length - 1]?.section ?? {
          x: 0,
          y: 0,
        };

        onChangeHoveredSection({
          startX,
          startY,
          endX,
          endY,
        });
      },
    });
    initialized.current = true;
  }, [onChangeHoveredSection]);

  useEffect(() => {
    if (!engine.current) {
      return;
    }

    engine.current.setShots(shots);
  }, [shots]);

  useEffect(() => {
    if (!engine.current || hoveredSection === undefined) {
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
  }, [hoveredSection, hoveringData]);

  return (
    <div ref={containerRef} className="w-full h-min relative">
      <canvas ref={canvasRef} className="rounded-xl"></canvas>

      <CourtTooltip shots={hoveringData} container={containerRef} />
    </div>
  );
};
