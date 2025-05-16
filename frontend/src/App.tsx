import React, { useState, useEffect, useRef } from "react";
import ChartComponent from "./components/ChartComponent";
import { TIEMPO_ACTUALIZACION } from "./config";
import "./estilos.css";
import { socket } from "./socket";

type AppState =
  | "INICIAL"
  | "MOSTRANDO_DATOS"
  | "MOSTRANDO_CEROS"
  | "COMPROBANDO_SENSOR";

const App: React.FC = () => {
  const [usuarioId, setUsuarioId] = useState("Pablo");
  const [chartData, setChartData] = useState<number[][]>([
    [0, 0, 0, 0, 0, 0, 0, 0],
  ]);
  const [comentarios, setComentarios] = useState<string[]>([]);
  const [estado, setEstado] = useState<AppState>("INICIAL");
  const [cicloCeros, setCicloCeros] = useState(0);
  const [mostrarSelector, setMostrarSelector] = useState(true);

  const previousData = useRef<number[][]>([[0, 0, 0, 0, 0, 0, 0, 0]]);

  const isDataDifferent = (a: number[][], b: number[][]) => {
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      if (!a[i] || !b[i]) return true;
      const aSlice = a[i].slice(-15);
      const bSlice = b[i].slice(-15);
      if (aSlice.length !== bSlice.length) return true;
      for (let j = 0; j < aSlice.length; j++) {
        if (aSlice[j] !== bSlice[j]) return true;
      }
    }
    return false;
  };

  type DatosResult = {
    datos: number[][];
    comentarios: string[];
  } | null;

  const fetchFromBackend = (): Promise<DatosResult> => {
    return new Promise((resolve) => {
      socket.emit("solicitarDatos", { proyectoId: "PEPI", usuarioId });

      socket.once("datosRecibidos", (response) => {
        if (
          !response ||
          !Array.isArray(response.datos) ||
          !Array.isArray(response.comentarios)
        ) {
          resolve(null);
        } else {
          resolve({
            datos: response.datos,
            comentarios: response.comentarios,
          });
        }
      });
    });
  };

  const iniciarConDatos = async () => {
    setMostrarSelector(false);
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
      }, 1500);
    }
  };

  const manejarFinAnimacion = async () => {
    if (estado === "MOSTRANDO_DATOS") {
      const result = await fetchFromBackend();
      if (result) {
        if (isDataDifferent(result.datos, previousData.current)) {
          console.log("Datos diferentes, actualizando...");
          setChartData(result.datos);
          previousData.current = result.datos;
          setComentarios(result.comentarios);
        } else {
          console.log("Datos iguales, mostrando ceros...");
          setEstado("MOSTRANDO_CEROS");
          setCicloCeros((prev) => prev + 1);
        }
      }
    } else if (estado === "MOSTRANDO_CEROS") {
      setCicloCeros((prev) => prev + 1);
    }
  };

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    if (estado === "MOSTRANDO_CEROS") {
      pollingInterval = setInterval(async () => {
        const result = await fetchFromBackend();
        if (result && isDataDifferent(result.datos, previousData.current)) {
          console.log("Datos diferentes, actualizando...");
          clearInterval(pollingInterval!);
          setChartData(result.datos);
          previousData.current = result.datos;
          setComentarios(result.comentarios);
          setEstado("MOSTRANDO_DATOS");
        }
      }, 1000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [estado]);

  const detener = () => {
    setEstado("INICIAL");
    setMostrarSelector(true);
  };

  const obtenerClaseEstado = () => {
    switch (estado) {
      case "MOSTRANDO_DATOS":
        return "verde";
      case "MOSTRANDO_CEROS":
        return "rojo";
      case "COMPROBANDO_SENSOR":
        return "naranja";
      default:
        return "gris";
    }
  };

  return (
    <div className="app-container">
      {mostrarSelector && (
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
              </select>
            </label>
            <button className="btn btn-start" onClick={iniciarConDatos}>
              Cargar Datos
            </button>
          </div>
        </div>
      )}

      {!mostrarSelector && (
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
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Fila 1 */}
            <div
              style={{
                justifySelf: "start",
                fontSize: "2.2rem",
                fontWeight: "bold",
              }}
            >
              Paciente: {usuarioId}
            </div>
            <button
              className="btn btn-stop"
              onClick={detener}
              style={{ justifySelf: "center" }}
            >
              Volver
            </button>
            <div
              className={`estado-circulo ${obtenerClaseEstado()}`}
              style={{ justifySelf: "end", marginRight: "2rem" }}
            ></div>

            {/* Fila 2 */}
            <div></div>
            <div>
              {estado === "MOSTRANDO_CEROS" && (
                <h2 style={{ color: "red", fontSize: "1.5rem", margin: 0 }}>
                  Dispositivo desconectado
                </h2>
              )}
              {estado === "COMPROBANDO_SENSOR" && (
                <h2 style={{ color: "orange", fontSize: "1.5rem", margin: 0 }}>
                  Comprobando conexión de sensor...
                </h2>
              )}
            </div>
            <div></div>
          </div>

          {(estado === "MOSTRANDO_DATOS" || estado === "MOSTRANDO_CEROS") && (
            <div className="chart-container">
              <ChartComponent
                data={chartData}
                isAnimating={true}
                usuarioId={usuarioId}
                onAnimationEnd={manejarFinAnimacion}
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
          )}
        </>
      )}
    </div>
  );
};

export default App;
