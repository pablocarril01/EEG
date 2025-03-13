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
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data = [] }) => {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [displayedData, setDisplayedData] = useState<ChartData[]>([]);
  const duration = TIEMPO_ACTUALIZACION; // 10 segundos en milisegundos

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      setCursorIndex(0);

      // Si es la primera vez, inicializar displayedData con los datos recibidos
      if (displayedData.length === 0) {
        const initialData = data.map((entry, index) => {
          const formattedEntry: ChartData = { name: `Muestra ${index + 1}` };
          entry.forEach((value, i) => {
            formattedEntry[`Canal ${i + 1}`] = value;
          });
          return formattedEntry;
        });
        setDisplayedData(initialData);
      }

      let currentIndex = 0;
      const interval = setInterval(() => {
        setCursorIndex((prevIndex) => {
          const nextIndex = prevIndex < data.length - 1 ? prevIndex + 1 : 0;
          currentIndex = nextIndex;

          setDisplayedData((prevData) => {
            const newData = [...prevData];
            if (newData[currentIndex]) {
              // Reemplazar solo el punto de datos actual con el nuevo valor
              newData[currentIndex] = {
                ...newData[currentIndex],
                ...data[currentIndex].reduce((acc, value, j) => {
                  acc[`Canal ${j + 1}`] = value;
                  return acc;
                }, {} as ChartData),
              };
            }
            return newData;
          });

          return nextIndex;
        });
      }, duration / data.length);

      return () => clearInterval(interval);
    }
  }, [data]);

  if (!Array.isArray(data) || data.length === 0) {
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

  const channels = Array.from({ length: 8 }, (_, i) => `Canal ${i + 1}`);

  return (
    <div
      style={{
        width: "100%",
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
                stroke={channelColors[i]}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceLine x={cursorIndex} stroke="#FF0000" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default ChartComponent;
