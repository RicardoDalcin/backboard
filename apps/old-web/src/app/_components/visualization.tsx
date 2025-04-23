'use client';

import { VisualizationEngine } from '@/engine/Visualization';
import { useEffect, useRef } from 'react';

import { shotsTable } from '@/db/schema';

export const Visualization = ({
  shots,
}: {
  shots: (typeof shotsTable.$inferSelect)[];
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);
  const engine = useRef<VisualizationEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container || initialized.current) {
      return;
    }

    if (engine.current) {
      engine.current.destroy();
    }

    engine.current = new VisualizationEngine(canvas, container);
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!engine.current) {
      return;
    }

    engine.current.setShots(shots);
  }, [shots]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas className="w-full h-full" ref={canvasRef}></canvas>
    </div>
  );
};
