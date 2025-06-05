import { EegData } from './eeg-data.entity';

export function parseRedisEEG(
  raw: string,
  usuarioId: string,
): Partial<EegData>[] {
  const medidas: Partial<EegData>[] = [];
  const parts = raw.split(';').filter((p) => p.trim() !== '');
  if (!parts.length) return [];

  // La primera parte debe ser 'i<timestamp_en_ms>'
  const header = parts[0];
  const match = header.match(/^i(\d{13})/);
  if (!match) return [];

  const baseTimestamp = Number(match[1]);
  let currentTimestamp = baseTimestamp;
  let count = 0;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes('i') || part.includes('f')) continue;

    const hexValues = part.split(',');
    if (hexValues.length !== 8) continue;

    const [c1, c2, c3, c4, c5, c6, c7, c8] = hexValues.map((h) =>
      parseInt(h, 16),
    );

    medidas.push({
      pacienteId: usuarioId,
      timestamp: new Date(currentTimestamp),
      canal1: c1,
      canal2: c2,
      canal3: c3,
      canal4: c4,
      canal5: c5,
      canal6: c6,
      canal7: c7,
      canal8: c8,
      evento: count === 0,
    });

    currentTimestamp += 2; // 2 ms de incremento (500 Hz)
    count++;
  }

  return medidas;
}
