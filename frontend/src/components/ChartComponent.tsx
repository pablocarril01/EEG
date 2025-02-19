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
  name: string;
  [key: string]: string | number; // Se permite que los valores sean número o string
}

interface ChartComponentProps {
  data: number[][];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No hay datos para mostrar</p>;
  }

  // Transformar los datos en el formato adecuado para recharts
  const transformedData: ChartData[] = data.map((entry, index) => {
    const formattedEntry: ChartData = { name: `Muestra ${index + 1}` };

    entry.forEach((value, i) => {
      formattedEntry[`Canal ${i + 1}`] = value;
    });

    return formattedEntry;
  });

  console.log("Datos transformados para la gráfica:", transformedData);

  // Lista fija de colores para los 8 canales
  const channelColors = [
    "#8884d8", // Canal 1
    "#82ca9d", // Canal 2
    "#ff7300", // Canal 3
    "#a4de6c", // Canal 4
    "#d0ed57", // Canal 5
    "#ffc658", // Canal 6
    "#8dd1e1", // Canal 7
    "#83a6ed", // Canal 8
  ];

  // Obtener la lista de canales (asumiendo que hay 8 canales)
  const channels = Array.from({ length: 8 }, (_, i) => `Canal ${i + 1}`);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)", // 4 columnas
        gridTemplateRows: "repeat(2, 1fr)", // 2 filas
        gap: "20px",
        width: "100%", // Ocupar todo el ancho disponible
        maxWidth: "1800px", // Limitar el ancho máximo para evitar que se estire demasiado
        margin: "0 auto", // Centrar el contenedor en la pantalla
      }}
    >
      {channels.map((channel, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "5px",
            width: "100%", // Asegurar que cada gráfica ocupe el ancho completo de su celda
          }}
        >
          <h3>{channel}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={channel}
                stroke={channelColors[i]} // Usar el color fijo para este canal
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default ChartComponent;
