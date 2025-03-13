import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  [key: string]: number | string;
}

interface ChartComponentProps {
  data: number[][];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p style={{ color: "#E0E0E0" }}>No hay datos para mostrar</p>;
  }

  const transformedData: ChartData[] = data.map((entry) => {
    const formattedEntry: ChartData = {};

    entry.forEach((value, i) => {
      formattedEntry[`Canal ${i + 1}`] = value;
    });

    return formattedEntry;
  });

  console.log("📌 Datos transformados para la gráfica:", transformedData);

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
            <LineChart data={transformedData}>
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default ChartComponent;
