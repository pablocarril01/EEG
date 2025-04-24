import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import "../estilos.css";

interface ChartData {
  [key: string]: number | string;
}

interface ChartComponentProps {
  data: number[][];
  isAnimating: boolean;
  usuarioId: string;
  onAnimationEnd?: () => void;
  shouldZero?: boolean;
  animationDuration: number;
}

// Nuevo orden visual deseado
const channelNames = ["FP1", "FP2", "T3", "T4", "O1", "O2", "C3", "C4"];

const ChartComponent: React.FC<ChartComponentProps> = ({
  data = [],
  isAnimating,
  usuarioId,
  onAnimationEnd,
  shouldZero = false,
  animationDuration,
}) => {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [displayedData, setDisplayedData] = useState<ChartData[]>([]);

  useEffect(() => {
    setCursorIndex(0);
    setDisplayedData([]);
  }, [usuarioId]);

  useEffect(() => {
    if (data.length > 0) {
      if (displayedData.length !== data.length) {
        setDisplayedData(new Array(data.length).fill({}));
      }
      setCursorIndex(0);
    }
  }, [data]);

  useEffect(() => {
    if (isAnimating && data.length > 0) {
      const finalData = shouldZero
        ? data.map((entry) => new Array(entry.length).fill(0))
        : data;

      // Mapeo desde el orden original a: ["FP1", "FP2", "T3", "T4", "O1", "O2", "C3", "C4"]
      // Orden original: ["FP2", "T4", "O2", "C4", "C3", "O1", "T3", "FP1"]
      const indexMap = [7, 0, 6, 1, 5, 2, 4, 3];

      const formattedData = finalData.map((entry) => {
        const formattedEntry: ChartData = {};
        indexMap.forEach((originalIndex, newIndex) => {
          formattedEntry[channelNames[newIndex]] = entry[originalIndex];
        });
        return formattedEntry;
      });

      const startTime = Date.now();
      const totalTime = animationDuration;
      const totalPoints = formattedData.length - 1;

      const interval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / totalTime, 1);
        const currentIndex = Math.min(
          Math.floor(progress * totalPoints),
          totalPoints
        );

        setCursorIndex(currentIndex);

        setDisplayedData((prevData) => {
          const newData = [...prevData];
          for (let i = 0; i <= currentIndex; i++) {
            newData[i] = {
              ...newData[i],
              ...formattedData[i],
            };
          }
          return newData;
        });

        if (progress >= 1) {
          clearInterval(interval);
          setCursorIndex(0);
          if (onAnimationEnd) onAnimationEnd();
        }
      }, 16);

      return () => clearInterval(interval);
    }
  }, [isAnimating, data, shouldZero, animationDuration]);

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
    <div className="chart-container">
      {channels.map((channel, i) => (
        <div key={i} className="chart-box">
          <h3 className="chart-title">{channel}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayedData}>
              <XAxis hide={true} />
              <YAxis
                width={0}
                stroke="#E0E0E0"
                domain={[-2000, 2000]}
                allowDataOverflow={true}
                tick={false}
              />
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
