// src/components/HistoricDataView.tsx
import React, { useState, useEffect } from "react";
import ChartComponent from "./ChartComponent";
import "./HistoricDataView.css";

type HistoricResponse = {
  datos: number[][];
};

const HistoricDataView: React.FC = () => {
  const [patients, setPatients] = useState<string[]>([]);
  const [patientId, setPatientId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [data, setData] = useState<number[][]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((list: string[]) => setPatients(list))
      .catch((err) => console.error("Error fetching patients:", err));
  }, []);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/historico?paciente=${encodeURIComponent(
          patientId
        )}&start=${startDate}&end=${endDate}`
      );
      const json: HistoricResponse = await res.json();
      setData(json.datos);
    } catch (err) {
      console.error("Error fetching historic data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const url = `/api/historico/edf?paciente=${encodeURIComponent(
      patientId
    )}&start=${startDate}&end=${endDate}`;
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        const filename = `${patientId}_${startDate.replace(
          /-/g,
          ""
        )}-${endDate.replace(/-/g, "")}.edf`;
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      })
      .catch((err) => console.error("Error downloading EDF:", err));
  };

  // dynamic width based on number of samples
  const chartWidth = Math.max((data[0]?.length || 500) * 2, 500);

  return (
    <div className="historic-view">
      <div className="historic-controls">
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="historic-select"
        >
          <option value="">-- Seleccione paciente --</option>
          {patients.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="historic-date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="historic-date"
        />
        <button
          onClick={handleFetch}
          disabled={!patientId || !startDate || !endDate || loading}
          className="btn btn-primary"
        >
          {loading ? "Cargando..." : "Mostrar Datos"}
        </button>
        <button
          onClick={handleDownload}
          disabled={!data.length}
          className="btn btn-secondary"
        >
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
              isAnimating={false}
              usuarioId={patientId}
              cicloCeros={0}
              shouldZero={false}
              animationDuration={1}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricDataView;
