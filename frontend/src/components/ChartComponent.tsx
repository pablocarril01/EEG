import React, { useRef, useEffect, useState } from "react";

interface ChartComponentProps {
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
  "#66C2FF",
  "#7FFF7F",
  "#FFD700",
  "#FF99CC",
  "#FFA07A",
  "#DDA0DD",
  "#40E0D0",
  "#B0E0E6",
];

const indexMap = [7, 0, 6, 1, 5, 2, 4, 3];

const ChartComponent: React.FC<ChartComponentProps> = ({
  data = [],
  isAnimating,
  usuarioId,
  onAnimationEnd,
  shouldZero = false,
  animationDuration,
  cicloCeros = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayedDataRef = useRef<number[][]>([]);
  const startTimeRef = useRef<number>(0);
  const [canvasWidth, setCanvasWidth] = useState(1200);

  const height = 1200;
  const numChannels = channelNames.length;
  const channelHeight = height / numChannels;
  const yMin = -2000;
  const yMax = 2000;

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        setCanvasWidth(newWidth);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    displayedDataRef.current = [];
  }, [usuarioId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const remappedData = data.map((entry) =>
      indexMap.map((idx) => entry?.[idx] ?? 0)
    );

    const finalData: number[][] = shouldZero
      ? remappedData.map(() => new Array(numChannels).fill(0))
      : remappedData;

    const totalPoints = finalData.length;
    if (totalPoints === 0) return;

    if (displayedDataRef.current.length !== totalPoints) {
      displayedDataRef.current = Array(totalPoints)
        .fill(0)
        .map(() => Array(numChannels).fill(0));
    }

    const draw = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      const currentCursor = Math.floor(progress * totalPoints);

      for (let i = 0; i <= currentCursor && i < totalPoints; i++) {
        displayedDataRef.current[i] = finalData[i];
      }

      ctx.clearRect(0, 0, canvasWidth, height);

      for (let c = 0; c < numChannels; c++) {
        ctx.beginPath();
        ctx.strokeStyle = colors[c % colors.length];
        ctx.lineWidth = 1;

        const offsetY = c * channelHeight;
        const midY = offsetY + channelHeight / 2;
        const scaleY = channelHeight / 2 / (yMax - yMin / 2);

        let hasMoved = false;

        for (let i = 0; i < totalPoints; i++) {
          const val = displayedDataRef.current[i]?.[c];

          if (val === undefined || val < yMin || val > yMax) {
            hasMoved = false;
            continue;
          }

          const x = (i / totalPoints) * canvasWidth;
          const y = midY - val * scaleY;

          if (!hasMoved) {
            ctx.moveTo(x, y);
            hasMoved = true;
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      const cursorX = (currentCursor / totalPoints) * canvasWidth;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        startTimeRef.current = 0;
        if (onAnimationEnd) onAnimationEnd();
      }
    };

    if (isAnimating && finalData.length > 0) {
      startTimeRef.current = 0;
      animationFrameId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isAnimating,
    data,
    shouldZero,
    animationDuration,
    cicloCeros,
    usuarioId,
    canvasWidth,
  ]);

  return (
    <div style={{ display: "flex", width: "100%" }}>
      <div style={{ width: "fit-content", paddingTop: "0px" }}>
        {indexMap.map((idx, i) => (
          <div
            key={i}
            style={{
              height: `${channelHeight}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              color: "white",
              fontSize: "18px",
              whiteSpace: "nowrap",
              paddingRight: "0px",
            }}
          >
            {channelNames[idx]}
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
