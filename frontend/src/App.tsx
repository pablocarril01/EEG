import React, { useState, useEffect, useRef } from "react";
import ChartComponent from "./components/ChartComponent";
import { TIEMPO_ACTUALIZACION } from "./config";
import io from "socket.io-client";
import "./estilos.css";

type AppState = "INICIAL" | "MOSTRANDO_DATOS" | "MOSTRANDO_CEROS";

// ✅ Conexión al WebSocket del backend
const socket = io("http://backend:3000", {
  transports: ["websocket"],
});

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
      const aSlice = a[i].slice(-15);
      const bSlice = b[i].slice(-15);
      if (aSlice.length !== bSlice.length) return true;
      for (let j = 0; j < aSlice.length; j++) {
        if (aSlice[j] !== bSlice[j]) return true;
      }
    }
    return false;
  };

  const iniciarConDatos = () => {
    console.log("✅ Enviando joinRoom con usuario:", usuarioId);
    socket.emit("joinRoom", usuarioId);

    // ✅ Activar backend para que procese y emita datos por WebSocket
    fetch(`http://localhost:3000/api/hexValues/PEPI/${usuarioId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📡 Backend procesó y respondió:", data);
      })
      .catch((err) => {
        console.error("❌ Error al contactar con el backend:", err);
      });

    setMostrarSelector(false);
    setEstado("MOSTRANDO_DATOS");
  };

  const manejarFinAnimacion = () => {
    if (estado === "MOSTRANDO_DATOS") {
      setEstado("MOSTRANDO_CEROS");
      setCicloCeros((prev) => prev + 1);
    } else if (estado === "MOSTRANDO_CEROS") {
      setCicloCeros((prev) => prev + 1);
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🔗 Conectado al WebSocket con ID:", socket.id);
    });

    socket.on(
      "nuevoDato",
      (payload: { datos: number[][]; comentarios: string[] }) => {
        console.log("📥 Recibido desde backend:", payload);

        if (!payload?.datos || !Array.isArray(payload.datos)) return;

        if (isDataDifferent(payload.datos, previousData.current)) {
          setChartData(payload.datos);
          previousData.current = payload.datos;
          setComentarios(payload.comentarios);
          setEstado("MOSTRANDO_DATOS");
        } else {
          setEstado("MOSTRANDO_CEROS");
          setCicloCeros((prev) => prev + 1);
        }
      }
    );

    return () => {
      socket.off("nuevoDato");
      socket.off("connect");
    };
  }, []);

  const detener = () => {
    setEstado("INICIAL");
    setMostrarSelector(true);
  };

  return (
    <div className="app-container">
      {mostrarSelector ? (
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
              <option value="4">4</option>
            </select>
          </label>
          <button className="btn btn-start" onClick={iniciarConDatos}>
            Cargar Datos
          </button>
        </div>
      ) : (
        <>
          <div className="top-bar">
            <div className="paciente-label">Paciente: {usuarioId}</div>
            <div
              className={`estado-circulo ${
                estado === "MOSTRANDO_DATOS" ? "verde" : "gris"
              }`}
            ></div>
          </div>

          <div className="buttons-container">
            <button className="btn btn-stop" onClick={detener}>
              Volver
            </button>
          </div>

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
