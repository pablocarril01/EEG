import React, { useState, useEffect } from "react";
import ChartComponent from "./components/ChartComponent";

const App: React.FC = () => {
  const [proyectoId, setProyectoId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [chartData, setChartData] = useState<number[][]>([]);
  const [lastData, setLastData] = useState<number[] | null>(null);
  const [isFetching, setIsFetching] = useState(false); // Estado para controlar el refresco automático

  const fetchData = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/hexValues/${proyectoId}/${usuarioId}`
      );
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }
      const rawData: string[] = await response.json();
      console.log("Datos recibidos:", rawData);

      if (!Array.isArray(rawData)) {
        throw new Error("Los datos recibidos no son un array");
      }

      // Convertir datos de hex a decimal
      const formattedData = rawData.map((hexString) =>
        hexString.split(";").map((val) => parseInt(val, 16))
      );

      setChartData(formattedData);
      setLastData(formattedData[formattedData.length - 1] || null);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    }
  };

  // Usar useEffect para ejecutar fetchData cada 100 ms cuando isFetching es true
  useEffect(() => {
    if (isFetching && proyectoId && usuarioId) {
      const intervalId = setInterval(fetchData, 100); // Ejecutar fetchData cada 100 ms

      // Limpiar el intervalo cuando el componente se desmonte o cuando isFetching cambie a false
      return () => clearInterval(intervalId);
    }
  }, [isFetching, proyectoId, usuarioId]);

  const handleStartFetching = () => {
    setIsFetching(true); // Activar el refresco automático
  };

  return (
    <div>
      <div>
        <label>
          Proyecto ID:
          <input
            type="text"
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Usuario ID:
          <input
            type="text"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
          />
        </label>
      </div>
      <div>
        <button onClick={handleStartFetching} disabled={isFetching}>
          {isFetching ? "Actualizando..." : "Cargar Datos"}
        </button>
        <button onClick={() => setIsFetching(false)} disabled={!isFetching}>
          Detener Actualización
        </button>
      </div>
      <ChartComponent data={chartData} />
      {lastData && (
        <div>
          <h3>Último Dato:</h3>
          <pre>{JSON.stringify(lastData)}</pre>
        </div>
      )}
    </div>
  );
};

export default App;
