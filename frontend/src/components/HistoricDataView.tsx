// src/components/HistoricDataView.tsx
import React, { useState, useEffect } from "react";
import GraficoEstatico from "./GraficoEstatico";
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
      console.log("✅ Datos históricos recibidos (filas×canales):", json.datos);
      // Transponer: de [samples][channels] a [channels][samples]
      const filas = json.datos;
      const nChannels = filas[0]?.length || 0;
      const transposed: number[][] = Array.from(
        { length: nChannels },
        (_, chIdx) => filas.map((fila) => fila[chIdx])
      );
      console.log("🔀 Datos transpuestos (canales×samples):", transposed);
      setData(transposed);
    } catch (err) {
      console.error("❌ Error fetching historic data:", err);
      setData([]); // limpiar datos
    } finally {
      setLoading(false);
      console.log("📌 handleFetch finalizado");
    }
  };

  const handleDownload = async () => {
    if (!pacienteId || !startDate || !endDate) return;
    setLoading(true);
    try {
      const url = `/api/historico/edf?paciente=${encodeURIComponent(
        pacienteId
      )}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(
        endDate
      )}`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Error EDF:", res.status, text);
        alert(`Error al generar EDF: ${res.status}\n${text}`);
        return;
      }
      const blob = await res.blob();
      const filename = `${pacienteId}_${startDate.replace(
        /-/g,
        ""
      )}-${endDate.replace(/-/g, "")}.edf`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("❌ Exception downloading EDF:", err);
      alert(`Error de red o de servidor: ${err}`);
    } finally {
      setLoading(false);
    }
  };

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
          style={{
            backgroundColor: "#d97706",
            borderColor: "#d97706",
            color: "#fff",
          }}
        >
          {loading ? "Cargando..." : "Mostrar Datos"}
        </button>
        <button
          onClick={handleDownload}
          disabled={!data.length}
          className="btn btn-secondary"
          style={{
            backgroundColor: "#d97706",
            borderColor: "#d97706",
            color: "#fff",
          }}
        >
          Descargar EDF
        </button>
      </div>

      <div className="historic-chart-wrapper">
        {data.length > 0 ? (
          <GraficoEstatico
            data={data}
            channelLabels={["FP1", "FP2", "T3", "T4", "O1", "O2", "C3", "C4"]}
            pixelsPerSample={2}
            heightPerChannel={100}
          />
        ) : (
          <p style={{ textAlign: "center", marginTop: "2rem", color: "#666" }}>
            {loading
              ? "Cargando gráfico..."
              : 'Selecciona paciente y fechas y pulsa "Mostrar Datos"'}
          </p>
        )}
      </div>
    </div>
  );
};

export default HistoricDataView;
