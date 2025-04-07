import React, { useState, useEffect } from "react";
import ChartComponent from "./components/ChartComponent";
import axios from "axios";

import { TIEMPO_ACTUALIZACION } from "./config";

import "./estilos.css";

const App: React.FC = () => {
  const [proyectoId, setProyectoId] = useState("PEPI");
  const [usuarioId, setUsuarioId] = useState("Pablo");
  const [chartData, setChartData] = useState<number[][]>([]);
  const [comentarios, setComentarios] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    document.body.classList.add("body");
    return () => {
      document.body.classList.remove("body");
    };
  }, []);

  const fetchData = async () => {
    try {
      if (!proyectoId || !usuarioId) return;

      let response;

      try {
        response = await axios.get(
          `http://localhost:3000/api/hexValues/${proyectoId}/${usuarioId}`
        );
      } catch {
        try {
          // Por si en algún entorno quieres intentar otra ruta (ej. producción o proxy)
          response = await axios.get(
            `/api/hexValues/${proyectoId}/${usuarioId}`
          );
        } catch (errorFinal) {
          console.error("❌ Ambas URLs fallaron:", errorFinal);
          response = null;
        }
      }

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
    <div className="app-container">
      <div className="selector-container">
        <label className="selector-label">
          Proyecto ID:
          <select
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
            className="selector-dropdown"
          >
            <option value="PEPI">PEPI</option>
          </select>
        </label>
        <label className="selector-label">
          Usuario ID:
          <select
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            className="selector-dropdown"
          >
            <option value="Pablo">Pablo</option>
            <option value="Ernesto">Ernesto</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>
      </div>

      <div className="buttons-container">
        <button
          onClick={() => {
            setIsFetching(true);
            setIsAnimating(true);
          }}
          disabled={isFetching}
          className="btn btn-start"
        >
          {isFetching ? "Actualizando..." : "Cargar Datos"}
        </button>
        <button
          onClick={() => {
            setIsFetching(false);
            setIsAnimating(false);
          }}
          disabled={!isFetching}
          className="btn btn-stop"
        >
          Detener
        </button>
      </div>

      <div className="chart-container">
        <ChartComponent
          data={chartData}
          isAnimating={isAnimating}
          usuarioId={usuarioId}
        />
      </div>

      <div className="comment-section">
        <h2>Comentarios</h2>
        {comentarios.length > 0 ? (
          <ul className="comment-list">
            {comentarios.map((comentario, index) => (
              <li key={index} className="comment-item">
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
