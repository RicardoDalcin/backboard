import { HoverCallbackData, VisualizationEngine } from '@/engine/Visualization';
import { Shot } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { CourtTooltip } from './court-tooltip';

export const Court = ({
  shots,
}: {
  shots: Pick<Shot, 'locX' | 'locY' | 'shotMade'>[];
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
      },
    });
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!engine.current) {
      return;
    }

    engine.current.setShots(shots);
  }, [shots]);

  return (
    <div ref={containerRef} className="w-full h-min relative">
      <canvas ref={canvasRef} className="rounded-xl"></canvas>

      <CourtTooltip shot={hoveringData} container={containerRef} />
    </div>
  );
};
