import React, { useState, useEffect, useRef } from "react";
import ChartComponent from "./components/ChartComponent";
import axios from "axios";
import { TIEMPO_ACTUALIZACION } from "./config";
import "./estilos.css";

type AppState = "INICIAL" | "MOSTRANDO_DATOS"; // Eliminamos MOSTRANDO_CEROS del tipo activo

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
  // const pollingInterval = useRef<NodeJS.Timeout | null>(null); // ya no lo usamos

  // const isDataDifferent = (a: number[][], b: number[][]) => {
  //   if (a.length !== b.length) return true;
  //   for (let i = 0; i < a.length; i++) {
  //     if (!a[i] || !b[i]) return true;
  //     const aSlice = a[i].slice(-15);
  //     const bSlice = b[i].slice(-15);
  //     if (aSlice.length !== bSlice.length) return true;
  //     for (let j = 0; j < aSlice.length; j++) {
  //       if (aSlice[j] !== bSlice[j]) return true;
  //     }
  //   }
  //   return false;
  // };

  const fetchFromBackend = async () => {
    try {
      const url = `http://localhost:3000/api/hexValues/PEPI/${usuarioId}`;
      const fallback = `/api/hexValues/PEPI/${usuarioId}`;
      const response = await axios.get(url).catch(() => axios.get(fallback));

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
      setMostrarSelector(false);
      setChartData(result.datos);
      previousData.current = result.datos;
      setComentarios(result.comentarios);
      setEstado("MOSTRANDO_DATOS");
    }
  };

  const manejarFinAnimacion = async () => {
    // En esta versión, simplemente pedimos datos y los mostramos
    const result = await fetchFromBackend();
    if (result) {
      setChartData(result.datos);
      previousData.current = result.datos;
      setComentarios(result.comentarios);
      setCicloCeros((prev) => prev + 1); // Fuerza nuevo barrido
    }

    // Código anterior que detectaba si los datos no habían cambiado y activaba ceros:
    // if (estado === "MOSTRANDO_DATOS") {
    //   const result = await fetchFromBackend();
    //   if (result) {
    //     if (isDataDifferent(result.datos, previousData.current)) {
    //       setChartData(result.datos);
    //       previousData.current = result.datos;
    //       setComentarios(result.comentarios);
    //     } else {
    //       setEstado("MOSTRANDO_CEROS");
    //       setCicloCeros((prev) => prev + 1);
    //     }
    //   }
    // } else if (estado === "MOSTRANDO_CEROS") {
    //   setCicloCeros((prev) => prev + 1);
    // }
  };

  const detener = () => {
    setEstado("INICIAL");
    setMostrarSelector(true);
    // if (pollingInterval.current) clearInterval(pollingInterval.current);
  };

  return (
    <div className="app-container">
      {mostrarSelector && (
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

      {!mostrarSelector && (
        <>
          <div className="top-bar">
            <div className="paciente-label">Paciente: {usuarioId}</div>
            <div className="estado-circulo verde" />
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
              shouldZero={false} // ya no lo usamos, pero lo dejamos por si vuelves a activarlo
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
