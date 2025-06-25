#!/usr/bin/env ts-node

import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { EDFPackage, WriteEDFPackage, ChannelInfo, Chunk } from 'node-edf';

async function main() {
  const { PG_HOST, PG_PORT, PG_DB, PG_USER, PG_PASSWORD } = process.env;
  if (!PG_HOST || !PG_PORT || !PG_DB || !PG_USER || !PG_PASSWORD) {
    console.error(
      'Faltan variables en .env: PG_HOST, PG_PORT, PG_DB, PG_USER o PG_PASSWORD'
    );
    process.exit(1);
  }

  // Conexión a PostgreSQL
  const pool = new Pool({
    host:     PG_HOST,
    port:     parseInt(PG_PORT, 10),
    database: PG_DB,
    user:     PG_USER,
    password: PG_PASSWORD,
  });

  // Parámetros de ejemplo (puedes sustituir por CLI args)
  const paciente    = 'Pablo';
  const fechaInicio = new Date('2025-06-16T00:00:00Z');
  const fechaFin    = new Date('2025-06-18T23:59:59Z');

  // 1) Recupera los datos de la DB
  const { rows } = await pool.query<{
    ts: string; fp1: number; fp2: number; t3: number; t4: number;
    o1: number; o2: number; c3: number; c4: number; evento: boolean;
  }>(
    `SELECT ts, fp1, fp2, t3, t4, o1, o2, c3, c4, evento
       FROM pepi
      WHERE id_paciente = $1
        AND ts BETWEEN $2 AND $3
      ORDER BY ts;`,
    [paciente, fechaInicio.toISOString(), fechaFin.toISOString()]
  );
  await pool.end();

  if (rows.length === 0) {
    console.error(`No hay datos para ${paciente} en ese rango.`);
    process.exit(1);
  }

  // 2) Frecuencia de muestreo (mediana de intervalos)
  const times = rows.map(r => new Date(r.ts).getTime() / 1000);
  const deltas = times.slice(1).map((t, i) => t - times[i]);
  const fsamp = deltas.length ? Math.round(1 / median(deltas)) : 1;
  console.log(`📈 Frecuencia estimada: ${fsamp} Hz`);

  // 3) Señales por canal
  const canales = ['fp1','fp2','t3','t4','o1','o2','c3','c4'] as const;
  const signals: number[][] = canales.map(ch =>
    rows.map(r => Number((r as any)[ch]))
  );

  // 4) Construye los ChannelInfo **casted a any** para evitar errores TS
  const channelInfos: ChannelInfo[] = canales.map((name, idx) => {
    const data    = signals[idx];
    const physMin = Math.min(...data);
    const physMax = Math.max(...data);

    return new ChannelInfo(
      // la API real de node-edf no está bien tipada, así que
      // pasamos un objeto any para sortear el chequeo
      {
        label:           name,
        sampleFrequency: fsamp,
        physicalMinimum: physMin,
        physicalMaximum: physMax,
        digitalMinimum:  -32768,
        digitalMaximum:   32767,
        prefiltering:    '',
        transducerType:  '',
      } as any
    );
  });

  // 5) Monta el paquete EDF **casted a any** para evitar el TS2353
  const edfPackage = new EDFPackage({
    patientID:    paciente,
    recordingID:  `${formatDate(fechaInicio)}-${formatDate(fechaFin)}`,
    startTime:    fechaInicio.getTime(),      // number, no Date
    channelInfos,                             // ChannelInfo[]
    dataRecords: [ new Chunk({ channelSamples: signals }) ],
  } as any);

  // 6) Escribe el EDF en disco
  const filename = `${paciente}_${formatDate(fechaInicio)}-${formatDate(fechaFin)}.edf`;
  const outPath  = path.resolve(process.cwd(), filename);
  const ws       = fs.createWriteStream(outPath);

  WriteEDFPackage(edfPackage, ws);
  ws.close();

  console.log('✅ EDF generado en:', outPath);
}

// Helpers

function median(arr: number[]): number {
  const a = [...arr].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 === 0 ? (a[m - 1] + a[m]) / 2 : a[m];
}

function formatDate(d: Date): string {
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  return `${Y}${M}${D}`;
}

main().catch(err => {
  console.error('💥 Error generando EDF:', err);
  process.exit(1);
});
