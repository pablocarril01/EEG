export function restar32768(data: number[][]): number[][] {
  return data.map((row) => row.map((value) => value - 32768));
}

export function filtroNotch(data: number[][]): number[][] {
  const fs = 500; // frecuencia de muestreo en Hz
  const f0 = 50; // frecuencia de rechazo
  const Q = 50;

  const w0 = (2 * Math.PI * f0) / fs;
  const alpha = Math.sin(w0) / (2 * Q);

  const b0 = 1;
  const b1 = -2 * Math.cos(w0);
  const b2 = 1;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;

  // Normalizamos los coeficientes
  const normB0 = b0 / a0;
  const normB1 = b1 / a0;
  const normB2 = b2 / a0;
  const normA1 = a1 / a0;
  const normA2 = a2 / a0;

  // Transponemos para filtrar señal por señal
  const transposed: number[][] = Array.from({ length: 8 }, (_, col) =>
    data.map((row) => row[col]),
  );

  const filteredSignals = transposed.map((signal) => {
    const y: number[] = [];
    let x1 = 0,
      x2 = 0;
    let y1 = 0,
      y2 = 0;

    for (let i = 0; i < signal.length; i++) {
      const x0 = signal[i];
      const y0 =
        normB0 * x0 + normB1 * x1 + normB2 * x2 - normA1 * y1 - normA2 * y2;
      y.push(y0);

      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }

    return y;
  });

  // Volvemos a transponer
  const result: number[][] = data.map((_, rowIndex) =>
    filteredSignals.map((signal) => signal[rowIndex]),
  );

  return result;
}

export function filtroPasoAlto(data: number[][]): number[][] {
  const fs = 500; // frecuencia de muestreo
  const fc = 0.5; // frecuencia de corte
  const w0 = (2 * Math.PI * fc) / fs;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * Math.sqrt(2)); // Butterworth Q = √2/2 para segundo orden

  const b0 = (1 + cosW0) / 2;
  const b1 = -(1 + cosW0);
  const b2 = (1 + cosW0) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosW0;
  const a2 = 1 - alpha;

  // Normalizamos los coeficientes
  const normB0 = b0 / a0;
  const normB1 = b1 / a0;
  const normB2 = b2 / a0;
  const normA1 = a1 / a0;
  const normA2 = a2 / a0;

  // Transponemos para trabajar señal por señal
  const transposed: number[][] = Array.from({ length: 8 }, (_, col) =>
    data.map((row) => row[col]),
  );

  const filteredSignals = transposed.map((signal) => {
    const y: number[] = [];
    let x1 = 0,
      x2 = 0;
    let y1 = 0,
      y2 = 0;

    for (let i = 0; i < signal.length; i++) {
      const x0 = signal[i];
      const y0 =
        normB0 * x0 + normB1 * x1 + normB2 * x2 - normA1 * y1 - normA2 * y2;
      y.push(y0);

      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }

    return y;
  });

  // Reensamblamos por filas
  const result: number[][] = data.map((_, rowIndex) =>
    filteredSignals.map((signal) => signal[rowIndex]),
  );

  return result;
}

export function filtroPasoBajo(data: number[][]): number[][] {
  const fs = 500; // frecuencia de muestreo
  const fc = 160; // frecuencia de corte
  const w0 = (2 * Math.PI * fc) / fs;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * Math.sqrt(2)); // Butterworth Q = √2/2

  const b0 = (1 - cosW0) / 2;
  const b1 = 1 - cosW0;
  const b2 = (1 - cosW0) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosW0;
  const a2 = 1 - alpha;

  // Normalizamos los coeficientes
  const normB0 = b0 / a0;
  const normB1 = b1 / a0;
  const normB2 = b2 / a0;
  const normA1 = a1 / a0;
  const normA2 = a2 / a0;

  // Transponemos para trabajar señal por señal
  const transposed: number[][] = Array.from({ length: 8 }, (_, col) =>
    data.map((row) => row[col]),
  );

  const filteredSignals = transposed.map((signal) => {
    const y: number[] = [];
    let x1 = 0,
      x2 = 0;
    let y1 = 0,
      y2 = 0;

    for (let i = 0; i < signal.length; i++) {
      const x0 = signal[i];
      const y0 =
        normB0 * x0 + normB1 * x1 + normB2 * x2 - normA1 * y1 - normA2 * y2;
      y.push(y0);

      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }

    return y;
  });

  // Reconstruimos la matriz original
  const result: number[][] = data.map((_, rowIndex) =>
    filteredSignals.map((signal) => signal[rowIndex]),
  );

  return result;
}

export function filtroMediana(data: number[][]): number[][] {
  const blockSize = 50;

  // Transponer para trabajar por señal
  const transposed: number[][] = Array.from({ length: 8 }, (_, col) =>
    data.map((row) => row[col]),
  );

  const filteredSignals = transposed.map((signal) => {
    const result: number[] = [];

    for (let i = 0; i < signal.length; i += blockSize) {
      const block = signal.slice(i, i + blockSize);
      const sorted = [...block].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];

      for (let j = 0; j < block.length; j++) {
        result.push(block[j] - median);
      }
    }

    return result;
  });

  // Reconstruir la matriz [nMuestras][8]
  const result: number[][] = data.map((_, rowIndex) =>
    filteredSignals.map((signal) => signal[rowIndex] ?? 0),
  );

  return result;
}

export function filtroMedia(data: number[][]): number[][] {
  const blockSize = 50;

  // Transponer para trabajar por señal
  const transposed: number[][] = Array.from({ length: 8 }, (_, col) =>
    data.map((row) => row[col]),
  );

  const filteredSignals = transposed.map((signal) => {
    const result: number[] = [];

    for (let i = 0; i < signal.length; i += blockSize) {
      const block = signal.slice(i, i + blockSize);
      const mean = block.reduce((sum, val) => sum + val, 0) / block.length;

      for (let j = 0; j < block.length; j++) {
        result.push(block[j] - mean);
      }
    }

    return result;
  });

  // Reconstruir la matriz [nMuestras][8]
  const result: number[][] = data.map((_, rowIndex) =>
    filteredSignals.map((signal) => signal[rowIndex] ?? 0),
  );

  return result;
}
