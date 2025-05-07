import React, { useState, useEffect, useRef } from "react";
import ChartComponent from "./components/ChartComponent";
import { TIEMPO_ACTUALIZACION } from "./config";
import io from "socket.io-client";
import "./estilos.css";

type AppState = "INICIAL" | "MOSTRANDO_DATOS" | "MOSTRANDO_CEROS";

// ✅ Conexión al WebSocket del backend
const socket = io("http://193.146.34.10:3000", {
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const previousData = useRef<number[][]>([[0, 0, 0, 0, 0, 0, 0, 0]]);
  const estadoRef = useRef(estado);
  const ultimaData = useRef<number[][]>([]);

  const isDataDifferent = (a: number[][], b: number[][]): boolean => {
    if (!a || !b || a.length !== b.length) return true;

    for (let i = 0; i < a.length; i++) {
      if (a[i].length !== b[i].length) return true;

      for (let j = 0; j < a[i].length; j++) {
        if (a[i][j] !== b[i][j]) return true;
      }
    }

    return false;
  };

  const iniciarConDatos = () => {
    console.log("✅ Enviando joinRoom con usuario:", usuarioId);
    socket.emit("joinRoom", usuarioId);

    // ✅ Activar backend para que procese y emita datos por WebSocket
    fetch(`http://193.146.34.10:3000/api/hexValues/PEPI/${usuarioId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.datos && Array.isArray(data.datos)) {
          previousData.current = data.datos;
          setChartData(data.datos); // ✅ Forzar datos iniciales sin comparar
          setComentarios(data.comentarios || []);
          console.log("📡 Backend procesó y respondió:", data);
        } else {
          console.warn("⚠️ Datos inválidos en respuesta inicial");
        }
      });

    setMostrarSelector(false);
    setEstado("MOSTRANDO_DATOS");
  };

  const manejarFinAnimacion = () => {
    console.log("⏱️ Fin del barrido. Estado actual:", estado);

    if (estado === "MOSTRANDO_DATOS") {
      console.log("🔍 Verificando si los datos han cambiado...");

      fetch(`http://193.146.34.10:3000/api/hexValues/PEPI/${usuarioId}`)
        .then((res) => res.json())
        .then((data) => {
          const nuevosDatos = data?.datos;
          if (!nuevosDatos || !Array.isArray(nuevosDatos)) return;

          const distintos = isDataDifferent(nuevosDatos, previousData.current);

          if (distintos) {
            console.log(
              "🟢 Nuevos datos detectados. Continuamos en MOSTRANDO_DATOS"
            );
            previousData.current = nuevosDatos;

            if (!isDataDifferent(nuevosDatos, ultimaData.current)) {
              console.log(
                "🔁 Datos ya visualizados. No se actualiza chartData."
              );
              return;
            }

            ultimaData.current = nuevosDatos;
            setChartData((prev) =>
              prev.map((fila, i) =>
                fila.map((valor, j) => nuevosDatos[i]?.[j] ?? valor)
              )
            );

            setEstado("MOSTRANDO_DATOS");
          } else {
            console.log("🟠 Datos sin cambios. Cambiamos a MOSTRANDO_CEROS");
            setEstado("MOSTRANDO_CEROS");
            setCicloCeros((prev) => prev + 1);
          }
        })
        .catch((err) => {
          console.error("❌ Error al verificar datos:", err);
        });
    } else if (estado === "MOSTRANDO_CEROS") {
      console.log("🔁 Repetición de ceros");
      setCicloCeros((prev) => prev + 1);
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🔗 Conectado al WebSocket con ID:", socket.id);
    });

    socket.on("nuevoDato", (payload) => {
      console.log("📥 Recibido desde backend:", payload);
      console.log("💡 Estado actual antes de decidir:", estadoRef.current);

      if (!payload?.datos || !Array.isArray(payload.datos)) return;

      const sonDatosNuevos = isDataDifferent(
        payload.datos,
        previousData.current
      );
      previousData.current = payload.datos;

      if (sonDatosNuevos) {
        if (!isDataDifferent(payload.datos, ultimaData.current)) {
          console.log(
            "🔁 Datos nuevos, pero ya estaban visualizados. Ignorando."
          );
          return;
        }

        ultimaData.current = payload.datos;

        setChartData(payload.datos);

        setComentarios(payload.comentarios);
        setEstado("MOSTRANDO_DATOS");
      } else if (estadoRef.current !== "MOSTRANDO_CEROS") {
        console.log("🟠 Datos sin cambios. Cambiamos a MOSTRANDO_CEROS");
        setEstado("MOSTRANDO_CEROS");
        setCicloCeros((prev) => prev + 1);
      }
    });

    return () => {
      socket.off("nuevoDato");
      socket.off("connect");
    };
  }, []);

  const detener = () => {
    setEstado("INICIAL");
    setMostrarSelector(true);
  };

  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  useEffect(() => {
    if (estado !== "MOSTRANDO_CEROS") return;

    const intervalo = setInterval(() => {
      console.log("🔍 [MOSTRANDO_CEROS] Consultando datos al backend...");
      fetch(`http://193.146.34.10:3000/api/hexValues/PEPI/${usuarioId}`)
        .then((res) => res.json())
        .then((data) => {
          const nuevosDatos = data?.datos;
          if (!nuevosDatos || !Array.isArray(nuevosDatos)) return;

          const distintos = isDataDifferent(nuevosDatos, previousData.current);

          if (distintos) {
            console.log(
              "🟢 Datos nuevos detectados → saliendo de MOSTRANDO_CEROS"
            );
            previousData.current = nuevosDatos;
            setChartData(nuevosDatos);
            setEstado("MOSTRANDO_DATOS");
          } else {
            console.log("🟡 Sin cambios, seguimos mostrando ceros");
          }
        })
        .catch((err) => {
          console.error(
            "❌ Error al verificar datos desde MOSTRANDO_CEROS:",
            err
          );
        });
    }, 1000); // cada segundo

    return () => clearInterval(intervalo);
  }, [estado, usuarioId]);

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
                estado === "MOSTRANDO_DATOS"
                  ? "verde"
                  : estado === "MOSTRANDO_CEROS"
                  ? "naranja"
                  : "gris"
              }`}
            />
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
