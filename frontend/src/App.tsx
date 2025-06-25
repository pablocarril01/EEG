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
  // -------------- ESTADOS DE APP ----------------
  const [usuarioId, setUsuarioId] = useState<string>("Pablo");
  const [chartData, setChartData] = useState<number[][]>([
    [0, 0, 0, 0, 0, 0, 0, 0],
  ]);
  const [comentarios, setComentarios] = useState<string[]>([]);
  const [estado, setEstado] = useState<AppState>("INICIAL");
  const [cicloCeros, setCicloCeros] = useState<number>(0);

  // controla si mostramos selector de live o la vista historic-data
  const [mostrarSelector, setMostrarSelector] = useState<boolean>(true);
  // modo “live” vs “historic”
  const [viewMode, setViewMode] = useState<"live" | "historic">("live");

  const previousData = useRef<number[][]>([[0, 0, 0, 0, 0, 0, 0, 0]]);

  // … el resto de funciones de live (fetchFromBackend, iniciarConDatos, manejarFinAnimacion, etc) …

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

  const iniciarConDatos = async () => {
    setMostrarSelector(false);
    setViewMode("live");
    setEstado("COMPROBANDO_SENSOR");

    const result = await fetchFromBackend();
    if (result) {
      previousData.current = result.datos;
      setComentarios(result.comentarios);

      setTimeout(async () => {
        const comprobacion = await fetchFromBackend();
        if (comprobacion) {
          if (isDataDifferent(comprobacion.datos, previousData.current)) {
            setChartData(comprobacion.datos);
            previousData.current = comprobacion.datos;
            setComentarios(comprobacion.comentarios);
            setEstado("MOSTRANDO_DATOS");
          } else {
            setChartData(comprobacion.datos);
            setEstado("MOSTRANDO_CEROS");
            setCicloCeros((prev) => prev + 1);
          }
        }
      }, TIEMPO_ACTUALIZACION);
    }
  };

  const verHistorico = () => {
    setMostrarSelector(false);
    setViewMode("historic");
  };

  const detener = () => {
    // vuelve al estado inicial de la app
    setEstado("INICIAL");
    setMostrarSelector(true);
    setViewMode("live");
    setChartData([[0, 0, 0, 0, 0, 0, 0, 0]]);
    setComentarios([]);
    setCicloCeros(0);
    previousData.current = [[0, 0, 0, 0, 0, 0, 0, 0]];
  };

  const isDataDifferent = (a: number[][], b: number[][]) => {
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      const aSlice = a[i].slice(-15);
      const bSlice = b[i].slice(-15);
      if (aSlice.length !== bSlice.length) return true;
      for (let j = 0; j < aSlice.length; j++) {
        if (aSlice[j] !== bSlice[j]) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  // ---------------- RENDER ----------------
  return (
    <div className="app-container">
      {/* ===== VISTA LIVE - SELECTOR INICIAL ===== */}
      {mostrarSelector && viewMode === "live" && (
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

      {/* ===== VISTA LIVE - CHART EN TIEMPO REAL ===== */}
      {!mostrarSelector && viewMode === "live" && (
        <>
          <div
            className="estado-layout"
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gridTemplateRows: "auto auto",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "0rem",
            }}
          >
            <div
              style={{
                justifySelf: "start",
                fontSize: "0.88rem",
                fontWeight: "normal",
              }}
            >
              Paciente: {usuarioId}
            </div>
            <div>
              <p style={{ color: "white", fontSize: "0.88rem", margin: 0 }}>
                PEPI v1.0 de 8 canales. 10 segundos / barrido, 500 Hz
              </p>
            </div>
            <button
              className="btn btn-stop"
              onClick={detener}
              style={{
                justifySelf: "end",
                marginRight: "2.2rem",
                width: "auto",
              }}
            >
              Volver al inicio
            </button>
          </div>

          {(estado === "MOSTRANDO_DATOS" || estado === "MOSTRANDO_CEROS") && (
            <div className="chart-container">
              <ChartComponent
                data={chartData}
                isAnimating={true}
                usuarioId={usuarioId}
                onAnimationEnd={async () => {
                  // tu lógica de recarga aquí…
                }}
                shouldZero={estado === "MOSTRANDO_CEROS"}
                animationDuration={TIEMPO_ACTUALIZACION}
                cicloCeros={cicloCeros}
              />
              {estado === "MOSTRANDO_CEROS" && (
                <div className="ciclo-ceros">Ciclos de cero: {cicloCeros}</div>
              )}
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

      {/* ===== VISTA HISTÓRICO ===== */}
      {viewMode === "historic" && (
        <>
          <button
            className="btn btn-link"
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
