// src/components/GraficoEstatico.tsx
import React, { useRef, useEffect } from "react";

interface GraficoEstaticoProps {
  data: number[][];
  channelLabels?: string[];
  pixelsPerSample?: number;
  heightPerChannel?: number;
}

const GraficoEstatico: React.FC<GraficoEstaticoProps> = ({
  data,
  channelLabels = ["FP1", "FP2", "T3", "T4", "O1", "O2", "C3", "C4"],
  pixelsPerSample = 2,
  heightPerChannel = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log("🎨 GraficoEstatico useEffect, data.length=", data.length);
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const samples = data[0].length;
    const width = samples * pixelsPerSample;
    const height = data.length * heightPerChannel;

    console.log(
      `📐 Canvas size: ${width}×${height}px; samples por canal=${samples}`
    );

    // Ajusta el tamaño real
    canvas.width = width;
    canvas.height = height;

    // 1) Fondo gris claro
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, width, height);

    // 2) Dibujar rectángulo de prueba (50×50) para comprobar que se ve algo
    ctx.fillStyle = "red";
    ctx.fillRect(10, 10, 50, 50);

    data.forEach((channel, chIdx) => {
      console.log(
        `🔎 Canal ${chIdx}: length=${channel.length}, min=${Math.min(
          ...channel
        )}, max=${Math.max(...channel)}`
      );

      const yTop = chIdx * heightPerChannel;
      const midY = yTop + heightPerChannel / 2;

      // Línea de base
      ctx.strokeStyle = "#ddd";
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Etiqueta
      ctx.fillStyle = "#000";
      ctx.font = "12px sans-serif";
      ctx.fillText(channelLabels[chIdx] || `Ch${chIdx + 1}`, 4, yTop + 14);

      // Escalado vertical
      const min = Math.min(...channel);
      const max = Math.max(...channel);
      const range = max - min || 1;

      // Dibuja la línea del canal
      ctx.strokeStyle = "#007bff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      channel.forEach((v, i) => {
        const x = i * pixelsPerSample;
        const y =
          yTop +
          heightPerChannel -
          5 -
          ((v - min) / range) * (heightPerChannel - 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, [data, pixelsPerSample, heightPerChannel, channelLabels]);

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        border: "1px solid #333",
        height: `${data.length * heightPerChannel}px`,
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
};

export default GraficoEstatico;
