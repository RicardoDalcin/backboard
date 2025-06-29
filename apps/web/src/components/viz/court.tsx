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
  hoveredSection?: { x: number; y: number } | null;
  onChangeHoveredSection: (section: { x: number; y: number } | null) => void;
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
        onChangeHoveredSection(data?.section ?? null);
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

    if (
      (!hoveredSection && !hoveringData) ||
      (hoveredSection &&
        hoveringData &&
        hoveredSection.x === hoveringData.section.x &&
        hoveredSection.y === hoveringData.section.y)
    ) {
      return;
    }

    engine.current.setHoveredShot(hoveredSection);
  }, [hoveredSection, hoveringData]);

  return (
    <div ref={containerRef} className="w-full h-min relative">
      <canvas ref={canvasRef} className="rounded-xl"></canvas>

      <CourtTooltip shot={hoveringData} container={containerRef} />
    </div>
  );
};
