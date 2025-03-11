import React, { useState, useEffect } from "react";
import ChartComponent from "./components/ChartComponent";
import axios from "axios";

const App: React.FC = () => {
  const [proyectoId, setProyectoId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [chartData, setChartData] = useState<number[][]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchData = async () => {
    try {
      if (!proyectoId || !usuarioId) return;

      const response = await axios.get(
        `http://localhost:3000/api/hexValues/${proyectoId}/${usuarioId}`
      );
      const rawData: number[][] = response.data.datos;

      console.log("📌 Datos recibidos:", rawData);

      if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error("Los datos recibidos no son válidos");
      }

      setChartData(rawData);
    } catch (error) {
      console.error("❌ Error al obtener los datos:", error);
    }
  };

  useEffect(() => {
    if (isFetching) {
      const intervalId = setInterval(fetchData, 500);
      return () => clearInterval(intervalId);
    }
  }, [isFetching, proyectoId, usuarioId]);

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "20px auto",
        textAlign: "center",
        padding: "20px",
        backgroundColor: "#121212",
        color: "#E0E0E0",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* 🔹 Inputs alineados en modo oscuro */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: "18px" }}>
          Proyecto ID:
          <input
            type="text"
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
            style={{
              width: "150px",
              padding: "8px",
              backgroundColor: "#222",
              color: "#E0E0E0",
              border: "1px solid #555",
              borderRadius: "4px",
              marginLeft: "5px",
            }}
          />
        </label>
        <label style={{ fontSize: "18px" }}>
          Usuario ID:
          <input
            type="text"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            style={{
              width: "150px",
              padding: "8px",
              backgroundColor: "#222",
              color: "#E0E0E0",
              border: "1px solid #555",
              borderRadius: "4px",
              marginLeft: "5px",
            }}
          />
        </label>
      </div>

      {/* 🔹 Botones oscuros */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "15px",
        }}
      >
        <button
          onClick={() => setIsFetching(true)}
          disabled={isFetching}
          style={{
            padding: "12px 20px",
            backgroundColor: isFetching ? "#4CAF50" : "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isFetching ? "default" : "pointer",
            opacity: isFetching ? 0.7 : 1,
            transition: "0.3s",
            fontSize: "16px",
          }}
        >
          {isFetching ? "Actualizando..." : "Cargar Datos"}
        </button>
        <button
          onClick={() => setIsFetching(false)}
          disabled={!isFetching}
          style={{
            padding: "12px 20px",
            backgroundColor: "#E63946",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: !isFetching ? "default" : "pointer",
            opacity: !isFetching ? 0.5 : 1,
            transition: "0.3s",
            fontSize: "16px",
          }}
        >
          Detener
        </button>
      </div>

      {/* 🔹 Gráficos en modo oscuro */}
      <div style={{ marginTop: "30px", width: "100%" }}>
        <ChartComponent data={chartData} />
      </div>
    </div>
  );
};

export default App;
