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

import "../estilos.css";

interface ChartData {
  [key: string]: number | string;
}

interface ChartComponentProps {
  data: number[][];
  isAnimating: boolean;
  usuarioId: string;
}

const channelNames = ["FP1", "FP2", "T1", "T2", "T3", "T4", "C3", "C4"];

const ChartComponent: React.FC<ChartComponentProps> = ({
  data = [],
  isAnimating,
  usuarioId,
}) => {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [displayedData, setDisplayedData] = useState<ChartData[]>([]);

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
              formattedEntry[channelNames[i] || `Canal ${i + 1}`] = value;
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
            formattedEntry[channelNames[i] || `Canal ${i + 1}`] = value;
          });
          return formattedEntry;
        });

        return prevData.length > 0 ? [...prevData] : newData;
      });

      const startTime = Date.now();
      const totalTime = TIEMPO_ACTUALIZACION;
      const totalPoints = data.length - 1;

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
            if (!data[i]) continue;

            newData[i] = {
              ...newData[i],
              ...data[i].reduce((acc, value, j) => {
                acc[channelNames[j] || `Canal ${j + 1}`] = value;
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
    <div className="chart-container">
      {channels.map((channel, i) => (
        <div key={i} className="chart-box">
          <h3 className="chart-title">{channel}</h3>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayedData}>
              <XAxis hide={true} />
              <YAxis
                stroke="#E0E0E0"
                domain={[-2000, 2000]} //(2.5 * 1e6) / (32768 * 3600)
                allowDataOverflow={true}
                tick={false}
              />
              {/* <Tooltip /> */}
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
