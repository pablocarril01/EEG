import React, { useState, useEffect } from "react";
import { TIEMPO_ACTUALIZACION } from "../config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ChartData {
  [key: string]: number | string;
}

interface ChartComponentProps {
  data: number[][];
  isAnimating: boolean;
  usuarioId: string; // Nueva prop para el ID del usuario
}

const canales = ["FP1", "FP2", "T1", "T2", "T3", "T4", "C3", "C4"];

const ChartComponent: React.FC<ChartComponentProps> = ({
  data = [],
  isAnimating,
  usuarioId, // Recibimos usuarioId como prop
}) => {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [displayedData, setDisplayedData] = useState<ChartData[]>([]);

  // Reiniciar el gráfico cuando cambie usuarioId
  useEffect(() => {
    setCursorIndex(0);
    setDisplayedData([]);
  }, [usuarioId]);

  useEffect(() => {
    if (data.length > 0) {
      setDisplayedData((prevData) => {
        if (prevData.length === 0) {
          return data.map((entry) => {
            const formattedEntry: ChartData = {};
            entry.forEach((value, i) => {
              formattedEntry[`${canales[i]}`] = value;
            });
            return formattedEntry;
          });
        }
        return prevData;
      });
      setCursorIndex(0);
    }
  }, [data]);

  useEffect(() => {
    if (isAnimating && data.length > 0) {
      setDisplayedData((prevData) => {
        const newData = data.map((entry) => {
          const formattedEntry: ChartData = {};
          entry.forEach((value, i) => {
            formattedEntry[`${canales[i]}`] = value;
          });
          return formattedEntry;
        });

        return prevData.length > 0 ? [...prevData] : newData;
      });

      const startTime = Date.now();
      const totalTime = TIEMPO_ACTUALIZACION;
      const totalPoints = data.length - 1; // Ajustamos para evitar índice fuera de rango

      const interval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / totalTime, 1);
        const currentIndex = Math.min(
          Math.floor(progress * totalPoints),
          totalPoints
        ); // Evita que sea mayor a totalPoints

        setCursorIndex(currentIndex);

        setDisplayedData((prevData) => {
          const newData = [...prevData];

          for (let i = 0; i <= currentIndex; i++) {
            if (!data[i]) continue; // Previene el error de undefined

            newData[i] = {
              ...newData[i],
              ...data[i].reduce((acc, value, j) => {
                acc[canales[j] || `Canal ${j + 1}`] = value;
                return acc;
              }, {} as ChartData),
            };
          }
          return newData;
        });

        if (progress >= 1) {
          clearInterval(interval);
        }
      }, 16);

      return () => clearInterval(interval);
    }
  }, [isAnimating, data]);

  if (displayedData.length === 0) {
    return <p style={{ color: "#E0E0E0" }}>No hay datos para mostrar</p>;
  }

  const channelColors = [
    "#66C2FF",
    "#7FFF7F",
    "#FFD700",
    "#FF99CC",
    "#FFA07A",
    "#DDA0DD",
    "#40E0D0",
    "#B0E0E6",
  ];

  const channels = Object.keys(displayedData[0]);

  return (
    <div
      style={{
        width: "calc(100vw - 70px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0px",
      }}
    >
      {channels.map((channel, i) => (
        <div
          key={i}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#222",
            display: "flex",
            alignItems: "center",
            color: "#E0E0E0",
            height: "10vh",
          }}
        >
          <h3
            style={{
              marginRight: "20px",
              writingMode: "vertical-rl",
              transform: "rotate(-90deg)",
            }}
          >
            {channel}
          </h3>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayedData}>
              <XAxis hide={true} />
              <YAxis stroke="#E0E0E0" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={channel}
                stroke={channelColors[i % channelColors.length]}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceLine x={cursorIndex} stroke="#FFFFFF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default ChartComponent;
