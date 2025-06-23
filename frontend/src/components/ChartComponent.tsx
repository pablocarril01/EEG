// src/components/ChartComponent.tsx
import React, { useRef, useEffect, useState } from "react";

export interface ChartComponentProps {
  data: number[][];
  isAnimating: boolean;
  usuarioId: string;
  onAnimationEnd?: () => void;
  shouldZero?: boolean;
  animationDuration: number;
  cicloCeros?: number;
}

const channelNames = ["FP1", "FP2", "T3", "T4", "O1", "O2", "C3", "C4"];
const colors = [
  "#00FF00",
  "#FF0000",
  "#0000FF",
  "#FFFF00",
  "#00FFFF",
  "#FF00FF",
  "#FFFFFF",
  "#C0C0C0",
];

const ChartComponent: React.FC<ChartComponentProps> = ({
  data,
  isAnimating,
  usuarioId,
  onAnimationEnd,
  shouldZero = false,
  animationDuration,
  cicloCeros,
}) => {
  // Ensure component updates when cicloCeros changes
  useEffect(() => {
    // no-op, depends on cicloCeros to trigger rerender
  }, [cicloCeros]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayedDataRef = useRef<number[][]>([]);
  const startTimeRef = useRef<number>(0);
  const [canvasWidth, setCanvasWidth] = useState<number>(
    containerRef.current?.offsetWidth ?? 1200
  );

  const height = 1200;
  const numChannels = channelNames.length;
  const channelHeight = height / numChannels;
  const yMin = -2000;
  const yMax = 2000;

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (parent && !parent.classList.contains("historic-chart-inner")) {
      const ro = new ResizeObserver(() => {
        if (containerRef.current) {
          setCanvasWidth(containerRef.current.offsetWidth);
        }
      });
      if (containerRef.current) ro.observe(containerRef.current);
      return () => ro.disconnect();
    }
  }, []);

  useEffect(() => {
    // Reset displayed data when user changes
    displayedDataRef.current = [];
  }, [usuarioId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const finalData = shouldZero
      ? data.map((row) => row.map((v) => (v === 0 ? 0 : v)))
      : data;
    const totalPoints = finalData.length;
    if (totalPoints === 0) return;

    if (displayedDataRef.current.length !== totalPoints) {
      displayedDataRef.current = Array.from({ length: totalPoints }, () =>
        new Array<number>(numChannels).fill(0)
      );
    }

    let rafId: number;
    const draw = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      const cursor = Math.floor(progress * totalPoints);

      for (let i = 0; i < cursor; i++) {
        displayedDataRef.current[i] = finalData[i];
      }

      ctx.clearRect(0, 0, canvasWidth, height);
      for (let c = 0; c < numChannels; c++) {
        ctx.beginPath();
        ctx.strokeStyle = colors[c % colors.length];
        ctx.lineWidth = 1;
        const offsetY = c * channelHeight;
        const midY = offsetY + channelHeight / 2;
        let moved = false;
        for (let i = 0; i < displayedDataRef.current.length; i++) {
          const x = (i / (totalPoints - 1)) * canvasWidth;
          const yRaw = displayedDataRef.current[i][c];
          const y = midY - ((yRaw - yMin) / (yMax - yMin)) * channelHeight;
          if (!moved) {
            ctx.moveTo(x, y);
            moved = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      const cursorX = (cursor / (totalPoints - 1)) * canvasWidth;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (progress < 1) {
        rafId = requestAnimationFrame(draw);
      } else {
        startTimeRef.current = 0;
        if (onAnimationEnd) onAnimationEnd();
      }
    };

    if (isAnimating) {
      startTimeRef.current = 0;
      rafId = requestAnimationFrame(draw);
    } else {
      startTimeRef.current = performance.now() - animationDuration;
      rafId = requestAnimationFrame(draw);
    }

    return () => cancelAnimationFrame(rafId);
  }, [
    data,
    isAnimating,
    shouldZero,
    animationDuration,
    usuarioId,
    canvasWidth,
  ]);

  return (
    <div style={{ display: "flex", width: "100%" }}>
      <div style={{ width: "fit-content" }}>
        {channelNames.map((name, i) => (
          <div
            key={i}
            style={{
              height: channelHeight,
              display: "flex",
              alignItems: "center",
              color: "white",
              fontSize: 12,
              paddingRight: 8,
            }}
          >
            {name}
          </div>
        ))}
      </div>
      <div style={{ flexGrow: 1 }} ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={height}
          style={{ width: "100%", height: `${height}px` }}
        />
      </div>
    </div>
  );
};

export default ChartComponent;
