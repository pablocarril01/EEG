import React, { useState, useEffect, useRef } from "react";
import ChartComponent from "./components/ChartComponent";
import axios from "axios";
import { TIEMPO_ACTUALIZACION } from "./config";
import "./estilos.css";

type AppState = "INICIAL" | "MOSTRANDO_DATOS" | "MOSTRANDO_CEROS";

const App: React.FC = () => {
  const [usuarioId, setUsuarioId] = useState("Pablo");
  const [chartData, setChartData] = useState<number[][]>([]);
  const [comentarios, setComentarios] = useState<string[]>([]);
  const [estado, setEstado] = useState<AppState>("INICIAL");
  const [isAnimating, setIsAnimating] = useState(false);

  const previousData = useRef<number[][]>([]);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

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

  const fetchFromBackend = async () => {
    try {
      let response;
      try {
        response = await axios.get(
          `http://localhost:3000/api/hexValues/PEPI/${usuarioId}`
        );
      } catch {
        response = await axios.get(`/api/hexValues/PEPI/${usuarioId}`);
      }

      if (!response?.data?.datos || !Array.isArray(response.data.datos))
        return null;

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

  const iniciarConDatos = async () => {
    const result = await fetchFromBackend();
    if (result) {
      setChartData(result.datos);
      previousData.current = result.datos;
      setComentarios(result.comentarios);
      setEstado("MOSTRANDO_DATOS");
      setIsAnimating(true);
    }
  };

  const manejarFinAnimacion = async () => {
    if (!isAnimating) return;

    if (estado === "MOSTRANDO_DATOS") {
      const result = await fetchFromBackend();
      if (result) {
        if (isDataDifferent(result.datos, previousData.current)) {
          setChartData(result.datos);
          previousData.current = result.datos;
          setComentarios(result.comentarios);
          setIsAnimating(true);
        } else {
          setEstado("MOSTRANDO_CEROS");
          setIsAnimating(false);
          setTimeout(() => setIsAnimating(true), 0); // 🔁 reiniciar ciclo de ceros
        }
      }
    } else if (estado === "MOSTRANDO_CEROS") {
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 0); // 🔁 ciclo continuo de ceros
    }
  };

  useEffect(() => {
    if (estado === "MOSTRANDO_CEROS") {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = setInterval(async () => {
        const result = await fetchFromBackend();
        if (result && isDataDifferent(result.datos, previousData.current)) {
          clearInterval(pollingInterval.current!);
          setChartData(result.datos);
          previousData.current = result.datos;
          setComentarios(result.comentarios);
          setEstado("MOSTRANDO_DATOS");
          setIsAnimating(true);
        }
      }, 1000);
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [estado]);

  const detener = () => {
    setIsAnimating(false);
    setEstado("INICIAL");
    if (pollingInterval.current) clearInterval(pollingInterval.current);
  };

  return (
    <div className="app-container">
      {estado === "INICIAL" && (
        <div className="selector-container">
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
          <button className="btn btn-start" onClick={iniciarConDatos}>
            Cargar Datos
          </button>
        </div>
      )}

      {estado !== "INICIAL" && (
        <>
          <div className="top-bar">
            <div className="paciente-label">Paciente: {usuarioId}</div>
            {estado === "MOSTRANDO_DATOS" && (
              <div className="estado-circulo verde"></div>
            )}
            {estado === "MOSTRANDO_CEROS" && (
              <div className="estado-circulo gris"></div>
            )}
          </div>

          <div className="buttons-container">
            <button className="btn btn-stop" onClick={detener}>
              Volver
            </button>
          </div>

          <div className="chart-container">
            <ChartComponent
              data={chartData}
              isAnimating={isAnimating}
              usuarioId={usuarioId}
              onAnimationEnd={manejarFinAnimacion}
              shouldZero={estado === "MOSTRANDO_CEROS"}
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
        </>
      )}
    </div>
  );
};

export default App;
