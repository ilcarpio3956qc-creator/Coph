import { useEffect, useRef, useState, useCallback } from 'react';
import { Plane } from 'lucide-react';

interface TrajectoryPoint {
  x: number;
  y: number;
}

interface TrajectoryChartProps {
  trajectoryPoints: TrajectoryPoint[];
  altitude: number;
  range: number;
  releasePoint?: TrajectoryPoint;
  impactPoint?: TrajectoryPoint;
  animationProgress?: number;
  mode?: 'free' | 'target';
  targetDistance?: number;
  targetPlacementMode?: 'random' | 'place';
  onTargetPlace?: (distance: number) => void;
  isHit?: boolean;
  aircraftSpeed?: number;
}

export function TrajectoryChart({
  trajectoryPoints,
  altitude,
  range,
  releasePoint,
  impactPoint,
  animationProgress = 0,
  mode = 'free',
  targetDistance = 850,
  targetPlacementMode = 'random',
  onTargetPlace,
  isHit = false,
  aircraftSpeed = 0,
}: TrajectoryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreviewDist, setDragPreviewDist] = useState<number | null>(null);

  const getDistanceFromMouse = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const scaleX_ratio = canvas.width / rect.width;
    const mouseCanvasX = (clientX - rect.left) * scaleX_ratio;
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const maxX = range || 2000;
    const dist = ((mouseCanvasX - padding) / chartWidth) * maxX;
    return Math.max(0, Math.min(maxX, Math.round(dist)));
  }, [range]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'target' || targetPlacementMode !== 'place') return;
    setIsDragging(true);
    const d = getDistanceFromMouse(e.clientX);
    setDragPreviewDist(d);
    onTargetPlace?.(d);
  }, [mode, targetPlacementMode, getDistanceFromMouse, onTargetPlace]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const d = getDistanceFromMouse(e.clientX);
    setDragPreviewDist(d);
    onTargetPlace?.(d);
  }, [isDragging, getDistanceFromMouse, onTargetPlace]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragPreviewDist(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setDragPreviewDist(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const padding = 100;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const maxX = range || 2000;
    const rawMaxY = trajectoryPoints.length > 0
      ? Math.max(...trajectoryPoints.map(p => p.y))
      : altitude;
    const maxY = Math.max(rawMaxY * 1.15, altitude * 1.1, 100);

    const scaleX = (x: number) => padding + (x / maxX) * chartWidth;
    const scaleY = (y: number) => height - padding - (y / maxY) * chartHeight;

    ctx.strokeStyle = '#30363D';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();

      const y = height - padding - (i / 10) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#8B949E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    ctx.fillStyle = '#8B949E';
    ctx.font = '24px JetBrains Mono';
    ctx.fillText('0', padding - 40, height - padding + 10);
    ctx.fillText(`${maxX.toFixed(0)}m`, width - padding - 60, height - padding + 36);
    ctx.fillText(`${maxY.toFixed(0)}m`, padding - 10, padding - 10);

    ctx.strokeStyle = '#E6A817';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 4;

    if (trajectoryPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(scaleX(trajectoryPoints[0].x), scaleY(trajectoryPoints[0].y));
      for (let i = 1; i < trajectoryPoints.length; i++) {
        ctx.lineTo(scaleX(trajectoryPoints[i].x), scaleY(trajectoryPoints[i].y));
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);

    if (releasePoint) {
      const releaseX = scaleX(releasePoint.x);
      const releaseY = scaleY(releasePoint.y);

      const aircraftEndX = width - padding;
      ctx.strokeStyle = '#8B949E';
      ctx.setLineDash([16, 12]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(releaseX, releaseY);
      ctx.lineTo(aircraftEndX, releaseY);
      ctx.stroke();
      ctx.setLineDash([]);

      const arrowSize = 16;
      ctx.fillStyle = '#8B949E';
      ctx.beginPath();
      ctx.moveTo(aircraftEndX, releaseY);
      ctx.lineTo(aircraftEndX - arrowSize, releaseY - arrowSize / 2);
      ctx.lineTo(aircraftEndX - arrowSize, releaseY + arrowSize / 2);
      ctx.closePath();
      ctx.fill();

      if (animationProgress > 0) {
        const aircraftX = releaseX + (aircraftEndX - releaseX) * animationProgress;
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✈', aircraftX, releaseY);
      }

      ctx.fillStyle = '#8B949E';
      ctx.font = '22px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('AIRCRAFT CONTINUES', (releaseX + aircraftEndX) / 2, releaseY - 24);

      ctx.fillStyle = '#39D353';
      ctx.beginPath();
      ctx.arc(releaseX, releaseY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8B949E';
      ctx.font = '22px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText('RELEASE', releaseX - 50, releaseY - 18);
    }

    if (mode === 'target') {
      const clampedTarget = Math.min(targetDistance, maxX);
      const targetX = scaleX(clampedTarget);
      const targetY = height - padding;

      const crossColor = isHit ? '#39D353' : '#F85149';
      ctx.strokeStyle = crossColor;
      ctx.lineWidth = 3;

      // Upward tick — clip so it never shoots to top of canvas
      ctx.save();
      ctx.beginPath();
      ctx.rect(padding, padding, chartWidth, chartHeight + padding);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(targetX, targetY - 36);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      ctx.restore();

      // Circle, horizontal line, downward tick — no clip needed
      ctx.strokeStyle = crossColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(targetX, targetY, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(targetX - 36, targetY);
      ctx.lineTo(targetX + 36, targetY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(targetX, targetY + 36);
      ctx.stroke();

      ctx.fillStyle = crossColor;
      ctx.font = '24px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('TARGET', targetX, targetY + 52);
      ctx.fillText(`${Math.round(clampedTarget)}m`, targetX, targetY + 82);

      if (isHit && animationProgress > 0.8) {
        const pulseRadius = 20 + Math.sin(animationProgress * 20) * 5;
        ctx.strokeStyle = `rgba(57, 211, 83, ${0.6 - (pulseRadius - 20) / 50})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(targetX, targetY, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (impactPoint) {
      ctx.fillStyle = '#F85149';
      ctx.beginPath();
      ctx.arc(scaleX(impactPoint.x), scaleY(impactPoint.y), 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8B949E';
      ctx.font = '22px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText('IMPACT', scaleX(impactPoint.x) - 50, scaleY(impactPoint.y) + 36);
    }

    if (animationProgress > 0 && trajectoryPoints.length > 0) {
      const index = Math.min(
        Math.floor(animationProgress * trajectoryPoints.length),
        trajectoryPoints.length - 1
      );
      const point = trajectoryPoints[index];
      ctx.fillStyle = '#E6A817';
      ctx.beginPath();
      ctx.arc(scaleX(point.x), scaleY(point.y), 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [trajectoryPoints, altitude, range, releasePoint, impactPoint, animationProgress, mode, targetDistance, isHit, aircraftSpeed]);

  return (
    <div className="relative w-full h-full bg-card border border-border rounded p-4">
      <div className="flex items-center gap-2 mb-4">
        <Plane className="w-5 h-5 text-accent" />
        <h3 className="uppercase tracking-wide text-sm text-muted-foreground">
          Trajectory Visualization
        </h3>
      </div>
      <canvas
        ref={canvasRef}
        width={1600}
        height={1000}
        className={`w-full h-[700px] ${mode === 'target' && targetPlacementMode === 'place' ? 'cursor-crosshair' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {isDragging && dragPreviewDist !== null && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card border border-chart-4 rounded px-3 py-1.5 font-mono text-xs text-chart-4 shadow-lg pointer-events-none"
        >
          TARGET: {dragPreviewDist} m
        </div>
      )}
    </div>
  );
}
