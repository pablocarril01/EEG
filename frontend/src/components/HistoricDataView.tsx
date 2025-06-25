// src/components/HistoricDataView.tsx
import React, { useState, useEffect } from "react";
import ChartComponent from "./ChartComponent";
import "./HistoricDataView.css";

type HistoricResponse = {
  datos: number[][];
};

const HistoricDataView: React.FC = () => {
  const [pacientes, setPacientes] = useState<string[]>([]);
  const [pacienteId, setPacienteId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [data, setData] = useState<number[][]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Carga la lista de pacientes
  useEffect(() => {
    console.log("📡 Cargando lista de pacientes...");
    fetch("/api/historico/pacientes")
      .then((r) => {
        console.log("↪️ Response pacientes status:", r.status);
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      })
      .then((lista: string[]) => {
        console.log("✅ Pacientes recibidos:", lista);
        setPacientes(lista);
      })
      .catch((err) => console.error("❌ Error al cargar pacientes:", err));
  }, []);

  const handleFetch = async () => {
    console.log("📡 Iniciando fetch de histórico...");
    console.log(
      "   paciente:",
      pacienteId,
      "start:",
      startDate,
      "end:",
      endDate
    );
    setLoading(true);
    try {
      const url = `/api/historico?paciente=${encodeURIComponent(
        pacienteId
      )}&start=${startDate}&end=${endDate}`;
      console.log("   URL fetch histórico:", url);
      const res = await fetch(url);
      console.log("↪️ Response histórico status:", res.status);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json: HistoricResponse = await res.json();
      console.log("✅ Datos históricos recibidos:", json.datos);
      setData(json.datos);
    } catch (err) {
      console.error("❌ Error fetching historic data:", err);
    } finally {
      setLoading(false);
      console.log("📌 handleFetch finalizado");
    }
  };

  const handleDownload = () => {
    const url = `/api/historico/edf?paciente=${encodeURIComponent(
      pacienteId
    )}&start=${startDate}&end=${endDate}`;
    console.log("📡 Iniciando descarga EDF desde:", url);

    fetch(url)
      .then((res) => {
        console.log("↪️ Response EDF status:", res.status);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        console.log("✅ Blob EDF recibido, tamaño:", blob.size);
        const filename = `${pacienteId}_${startDate.replace(
          /-/g,
          ""
        )}-${endDate.replace(/-/g, "")}.edf`;
        const link = document.createElement("a");
        const href = window.URL.createObjectURL(blob);
        link.href = href;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(href);
        console.log("📥 Descarga disparada con filename:", filename);
      })
      .catch((err) => console.error("❌ Error downloading EDF:", err));
  };

  // Cálculo del ancho dinámico para scroll horizontal
  const chartWidth = Math.max((data[0]?.length || 500) * 2, 500);

  return (
    <div className="historic-view">
      <div className="historic-controls">
        <select
          value={pacienteId}
          onChange={(e) => setPacienteId(e.target.value)}
          className="historic-select"
        >
          <option value="">-- Seleccione paciente --</option>
          {pacientes.map((id) => (
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
          disabled={!pacienteId || !startDate || !endDate || loading}
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
              usuarioId={pacienteId}
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
