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
  const [shouldZero, setShouldZero] = useState(false);

  useEffect(() => {
    document.body.classList.add("body");
    return () => {
      document.body.classList.remove("body");
    };
  }, []);

  const isDataDifferent = (a: number[][], b: number[][]) => {
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      if (!a[i] || !b[i]) return true;
      if (a[i].length !== b[i].length) return true;
      for (let j = 0; j < a[i].length; j++) {
        if (a[i][j] !== b[i][j]) return true;
      }
    }
    return false;
  };

  const fetchFromBackend = async (): Promise<{
    datos: number[][];
    comentarios: string[];
  } | null> => {
    try {
      let response;
      try {
        response = await axios.get(
          `http://localhost:3000/api/hexValues/${proyectoId}/${usuarioId}`
        );
      } catch {
        response = await axios.get(`/api/hexValues/${proyectoId}/${usuarioId}`);
      }

      if (!response || !Array.isArray(response.data?.datos)) return null;

      return {
        datos: response.data.datos,
        comentarios: Array.isArray(response.data.comentarios)
          ? response.data.comentarios
          : [],
      };
    } catch (error) {
      console.error("❌ Error al obtener datos:", error);
      return null;
    }
  };

  const fetchUntilNewData = async () => {
    console.log("⏳ Esperando datos nuevos del backend...");
    let nuevosDatos: number[][] = [];
    let nuevosComentarios: string[] = [];

    while (true) {
      const result = await fetchFromBackend();
      if (result && isDataDifferent(result.datos, chartData)) {
        nuevosDatos = result.datos;
        nuevosComentarios = result.comentarios;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("✅ Nuevos datos detectados. Iniciando animación.");
    setChartData(nuevosDatos);
    setComentarios(nuevosComentarios);
    setShouldZero(false);
    setIsAnimating(true);
  };

  const handleAnimationEnd = () => {
    if (isFetching) {
      fetchUntilNewData(); // 🚀 buscar datos diferentes antes de animar de nuevo
    }
  };

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
            fetchUntilNewData(); // primer ciclo
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
          onAnimationEnd={handleAnimationEnd}
          shouldZero={shouldZero}
          animationDuration={TIEMPO_ACTUALIZACION}
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
