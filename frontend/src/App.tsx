// src/App.tsx
import React, { useState, useEffect, useRef } from "react";
import ChartComponent from "./components/ChartComponent";
import HistoricDataView from "./components/HistoricDataView";
import { TIEMPO_ACTUALIZACION } from "./config";
import "./estilos.css";
import { socket } from "./socket";

type AppState =
  | "INICIAL"
  | "COMPROBANDO_SENSOR"
  | "MOSTRANDO_DATOS"
  | "MOSTRANDO_CEROS"
  | "";

type DatosResult = {
  datos: number[][];
  comentarios: string[];
} | null;

const App: React.FC = () => {
  // ----- Estados de datos y control -----
  const [usuarioId, setUsuarioId] = useState<string>("Pablo");
  const [chartData, setChartData] = useState<number[][]>([
    [0, 0, 0, 0, 0, 0, 0, 0],
  ]);
  const [comentarios, setComentarios] = useState<string[]>([]);
  const [estado, setEstado] = useState<AppState>("INICIAL");
  const [cicloCeros, setCicloCeros] = useState<number>(0);

  // Control de vista: selector, live o histórico
  const [viewMode, setViewMode] = useState<"selector" | "live" | "historic">(
    "selector"
  );

  const previousData = useRef<number[][]>([[0, 0, 0, 0, 0, 0, 0, 0]]);

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  // ----- Funciones de fetch -----
  const fetchFromBackend = (): Promise<DatosResult> =>
    new Promise((resolve) => {
      socket.emit("solicitarDatos", { proyectoId: "PEPI", usuarioId });
      socket.once("datosRecibidos", (response) => {
        if (
          !response ||
          !Array.isArray(response.datos) ||
          !Array.isArray(response.comentarios)
        ) {
          resolve(null);
        } else {
          resolve({ datos: response.datos, comentarios: response.comentarios });
        }
      });
    });

  // ----- Live mode -----
  const iniciarConDatos = async () => {
    setViewMode("live");
    setEstado("COMPROBANDO_SENSOR");

    const result = await fetchFromBackend();
    if (result) {
      previousData.current = result.datos;
      setComentarios(result.comentarios);

      setTimeout(async () => {
        const comprobacion = await fetchFromBackend();
        if (comprobacion) {
          const distinto = isDataDifferent(
            comprobacion.datos,
            previousData.current
          );
          setChartData(comprobacion.datos);
          setComentarios(comprobacion.comentarios);
          setEstado(distinto ? "MOSTRANDO_DATOS" : "MOSTRANDO_CEROS");
          if (!distinto) setCicloCeros((c) => c + 1);
          previousData.current = comprobacion.datos;
        }
      }, TIEMPO_ACTUALIZACION);
    }
  };

  // ----- Histórico mode -----
  const verHistorico = () => {
    setViewMode("historic");
  };

  // ----- Reset a estado inicial -----
  const detener = () => {
    setViewMode("selector");
    setEstado("INICIAL");
    setChartData([[0, 0, 0, 0, 0, 0, 0, 0]]);
    setComentarios([]);
    setCicloCeros(0);
    previousData.current = [[0, 0, 0, 0, 0, 0, 0, 0]];
  };

  // Compara solo los últimos 15 puntos de cada canal
  const isDataDifferent = (a: number[][], b: number[][]) => {
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      const as = a[i].slice(-15),
        bs = b[i].slice(-15);
      if (as.length !== bs.length) return true;
      for (let j = 0; j < as.length; j++) {
        if (as[j] !== bs[j]) return true;
      }
    }
    return false;
  };

  // ----- Render -----
  return (
    <div className="app-container">
      {viewMode === "selector" && (
        <div className="selector-container">
          <img src="/PEPI.png" alt="Logo PEPI" className="logo-cima" />
          <div className="selector-row">
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
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
            <button
              className="btn btn-start"
              onClick={iniciarConDatos}
              disabled={!usuarioId}
            >
              Cargar Datos
            </button>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button
              className="btn btn-secondary"
              onClick={verHistorico}
              disabled={!usuarioId}
            >
              Ver Histórico
            </button>
          </div>
        </div>
      )}

      {viewMode === "live" && (
        <>
          <button
            className="btn btn-link"
            onClick={detener}
            style={{ margin: "1rem", color: "#dc3545" }}
          >
            ← Volver al inicio
          </button>

          <div className="estado-layout">
            <div style={{ justifySelf: "start" }}>Paciente: {usuarioId}</div>
            <div>
              <p className="info-text">
                PEPI v1.0 de 8 canales. 10 segundos / barrido, 500 Hz
              </p>
            </div>
            <div style={{ justifySelf: "end" }}>
              <p className="info-text">Estado: {estado}</p>
            </div>
          </div>

          {(estado === "MOSTRANDO_DATOS" || estado === "MOSTRANDO_CEROS") && (
            <div className="chart-container">
              <ChartComponent
                data={chartData}
                isAnimating={true}
                usuarioId={usuarioId}
                onAnimationEnd={async () => {}}
                shouldZero={estado === "MOSTRANDO_CEROS"}
                animationDuration={TIEMPO_ACTUALIZACION}
                cicloCeros={cicloCeros}
              />
            </div>
          )}

          {(estado === "MOSTRANDO_DATOS" || estado === "MOSTRANDO_CEROS") && (
            <div className="comment-section">
              <h2>Comentarios</h2>
              {comentarios.length > 0 ? (
                <ul className="comment-list">
                  {comentarios.map((c, i) => (
                    <li key={i} className="comment-item">
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay comentarios disponibles.</p>
              )}
            </div>
          )}
        </>
      )}

      {viewMode === "historic" && (
        <>
          <button
            className="btn btn-primary"
            onClick={detener}
            style={{ margin: "1rem" }}
          >
            ← Volver al inicio
          </button>
          <HistoricDataView />
        </>
      )}
    </div>
  );
};

export default App;
