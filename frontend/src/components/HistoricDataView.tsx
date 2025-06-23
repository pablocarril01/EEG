// src/components/HistoricDataView.tsx
import React, { useState, useEffect } from "react";
import ChartComponent from "./ChartComponent";
import "./HistoricDataView.css";

const HistoricDataView: React.FC = () => {
  const [patients, setPatients] = useState<string[]>([]);
  const [paciente, setPaciente] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [data, setData] = useState<number[][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then((list: string[]) => setPatients(list))
      .catch(console.error);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const url = `/api/historico?paciente=${encodeURIComponent(
      paciente
    )}&start=${start}&end=${end}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      setData(json.datos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadEdf = () => {
    const url = `/api/historico/edf?paciente=${encodeURIComponent(
      paciente
    )}&start=${start}&end=${end}`;
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        const fn = `${paciente}_${start.replace(/-/g, "")}-${end.replace(
          /-/g,
          ""
        )}.edf`;
        a.href = URL.createObjectURL(blob);
        a.download = fn;
        a.click();
      })
      .catch(console.error);
  };

  // ancho para el scroll: 2px por muestra (ajústalo)
  const chartWidth = Math.max((data[0]?.length ?? 250) * 2, 500);

  return (
    <div className="historic-view">
      <h2>Histórico de pacientes</h2>
      <div className="historic-controls">
        <select value={paciente} onChange={(e) => setPaciente(e.target.value)}>
          <option value="">— Seleccione —</option>
          {patients.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        <button
          onClick={fetchData}
          disabled={!paciente || !start || !end || loading}
        >
          {loading ? "Cargando..." : "Cargar gráfico"}
        </button>
        <button onClick={downloadEdf} disabled={!data.length}>
          Descargar EDF
        </button>
      </div>
      <div className="historic-chart-wrapper">
        <div
          className="historic-chart-inner"
          style={{ width: `${chartWidth}px` }}
        >
          {data.length > 0 && (
            <ChartComponent
              data={data}
              isAnimating={true}
              animationDuration={1} /* dibuja todo al instante */
              usuarioId={paciente}
              cicloCeros={0}
              shouldZero={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricDataView;
