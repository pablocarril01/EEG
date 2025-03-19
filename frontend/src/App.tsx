import React, { useState, useEffect } from "react";
import ChartComponent from "./components/ChartComponent";
import axios from "axios";
import { TIEMPO_ACTUALIZACION } from "./config";

const App: React.FC = () => {
  const [proyectoId, setProyectoId] = useState("PEPI");
  const [usuarioId, setUsuarioId] = useState("Ernesto");
  const [chartData, setChartData] = useState<number[][]>([]);
  const [comentarios, setComentarios] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#121212";
    document.body.style.color = "#E0E0E0";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.height = "100vh";

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.height = "";
    };
  }, []);

  const fetchData = async () => {
    try {
      if (!proyectoId || !usuarioId) return;

      const response = await axios.get(
        `http://localhost:3000/api/hexValues/${proyectoId}/${usuarioId}`
      );

      const { datos, comentarios } = response.data;

      console.log("📌 Datos recibidos:", datos);
      console.log("📌 Comentarios recibidos:", comentarios);

      if (!Array.isArray(datos) || datos.length === 0) {
        throw new Error("Los datos recibidos no son válidos");
      }

      setChartData(datos);
      setComentarios(comentarios);
    } catch (error) {
      console.error("❌ Error al obtener los datos:", error);
    }
  };

  useEffect(() => {
    if (isFetching) {
      fetchData();
      const intervalId = setInterval(fetchData, TIEMPO_ACTUALIZACION);
      return () => clearInterval(intervalId);
    }
  }, [isFetching, proyectoId, usuarioId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "20px",
        backgroundColor: "#121212",
        color: "#E0E0E0",
        fontFamily: "'Inter', sans-serif",
        width: "100%",
      }}
    >
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
          <select
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
          >
            <option value="PEPI">PEPI</option>
          </select>
        </label>
        <label style={{ fontSize: "18px" }}>
          Usuario ID:
          <select
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
          >
            <option value="Ernesto">Ernesto</option>
            <option value="Pablo">Pablo</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>
      </div>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "15px",
        }}
      >
        <button
          onClick={() => {
            setIsFetching(true);
            setIsAnimating(true);
          }}
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
          onClick={() => {
            setIsFetching(false);
            setIsAnimating(false);
          }}
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

      <div style={{ marginTop: "30px", width: "100%" }}>
        <ChartComponent
          data={chartData}
          isAnimating={isAnimating}
          usuarioId={usuarioId}
        />
      </div>

      {/* Sección de comentarios */}
      <div style={{ marginTop: "20px", width: "80%", textAlign: "left" }}>
        <h2>Comentarios</h2>
        {comentarios.length > 0 ? (
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {comentarios.map((comentario, index) => (
              <li
                key={index}
                style={{
                  backgroundColor: "#222",
                  color: "#E0E0E0",
                  padding: "10px",
                  marginBottom: "5px",
                  borderRadius: "5px",
                }}
              >
                {comentario}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay comentarios disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default App;
