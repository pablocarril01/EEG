import React, { useState, useEffect } from "react";
import { TIEMPO_ACTUALIZACION } from "../config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  data = [],
  isAnimating,
}) => {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [displayedData, setDisplayedData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (data.length > 0) {
      setDisplayedData((prevData) => {
        if (prevData.length === 0) {
          return data.map((entry, index) => {
            const formattedEntry: ChartData = {};
            entry.forEach((value, i) => {
              formattedEntry[`Canal ${i + 1}`] = value;
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
            formattedEntry[`Canal ${i + 1}`] = value;
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
                acc[`Canal ${j + 1}`] = value;
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
        gap: "20px",
      }}
    >
      {channels.map((channel, i) => (
        <div
          key={i}
          style={{
            width: "100%",
            border: "1px solid #444",
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: "#222",
            textAlign: "center",
            color: "#E0E0E0",
          }}
        >
          <h3>{channel}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={displayedData}>
              <CartesianGrid stroke="#555" strokeDasharray="3 3" />
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
              {cursorIndex < displayedData.length ? (
                <ReferenceLine
                  x={cursorIndex}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default ChartComponent;
