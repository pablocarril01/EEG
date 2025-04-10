export function convertirADCaMicrovoltios(valorADC: number): number {
  const factor = (2.5 * 1e6) / (32768 * 3600);
  return valorADC * factor;
}

export function restar32768(matriz: number[][]): number[][] {
  return matriz.map((fila) => fila.map((valor) => valor - 32768));
}

export function calcularMedias(listaDeListas: number[][]): number[] {
  const numElementos = listaDeListas.length;
  if (numElementos === 0) return Array(8).fill(0); // Si la lista está vacía, devuelve un vector de ceros.

  const sumas = Array(8).fill(0); // Inicializa un array de sumas con 8 valores en 0.

  listaDeListas.forEach((lista) => {
    lista.forEach((valor, indice) => {
      sumas[indice] += valor; // Suma los valores en sus respectivas posiciones.
    });
  });

  return sumas.map((suma) => suma / numElementos); // Calcula las medias dividiendo entre la cantidad de listas.
}

export function restarMedias(
  listaDeListas: number[][],
  medias: number[],
): number[][] {
  return listaDeListas.map((lista) =>
    lista.map((valor, indice) => valor - medias[indice]),
  );
}

export function calcularMedianas(listaDeListas: number[][]): number[] {
  const numElementos = listaDeListas.length;
  if (numElementos === 0) return Array(8).fill(0); // Si está vacío, devuelve un vector de ceros.

  const columnas = Array.from({ length: 8 }, (_, i) =>
    listaDeListas.map((lista) => lista[i]).sort((a, b) => a - b),
  );

  return columnas.map((columna) => {
    const mitad = Math.floor(columna.length / 2);
    return columna.length % 2 === 0
      ? (columna[mitad - 1] + columna[mitad]) / 2 // Promedio de los dos valores centrales
      : columna[mitad]; // Valor central si la longitud es impar
  });
}

export function restarMedianas(
  listaDeListas: number[][],
  medianas: number[],
): number[][] {
  return listaDeListas.map((lista) =>
    lista.map((valor, indice) => valor - medianas[indice]),
  );
}

import { IIRFilter } from 'dsp.js';

export function eliminarSenoideNotch(
  datos: number[][],
  frecuenciaObjetivo = 50,
  sampleRate = 500,
): number[][] {
  if (!Array.isArray(datos) || datos.length === 0 || datos[0].length !== 8) {
    console.error(
      '❌ Datos no válidos. Asegúrate de que cada muestra tiene 8 canales.',
    );
    return [];
  }

  const numCanales = 8;
  const filtros = Array.from(
    { length: numCanales },
    () => new IIRFilter('notch', sampleRate, 2, frecuenciaObjetivo),
  );

  const resultado: number[][] = [];

  for (let i = 0; i < datos.length; i++) {
    const muestra = datos[i];
    const muestraFiltrada = new Array<number>(numCanales);

    for (let canal = 0; canal < numCanales; canal++) {
      muestraFiltrada[canal] = filtros[canal].process(muestra[canal]);
    }

    resultado.push(muestraFiltrada);
  }

  return resultado;
}

export function aplicarPasaAlto(
  datos: number[][],
  frecuenciaCorte = 0.5,
  sampleRate = 500,
): number[][] {
  if (!Array.isArray(datos) || datos.length === 0 || datos[0].length !== 8) {
    throw new Error(
      '❌ La entrada no es válida: debe ser una lista de listas de 8 valores',
    );
  }

  const numCanales = 8;
  const filtros: IIRFilter[] = Array.from(
    { length: numCanales },
    () => new IIRFilter('highpass', sampleRate, 2, frecuenciaCorte),
  );

  // Resultado: lista de listas
  const resultado: number[][] = [];

  for (let i = 0; i < datos.length; i++) {
    const muestraOriginal = datos[i];
    const muestraFiltrada: number[] = [];

    for (let canal = 0; canal < numCanales; canal++) {
      const valor = muestraOriginal[canal];
      const filtrado = filtros[canal].process(valor);
      muestraFiltrada.push(filtrado);
    }

    resultado.push(muestraFiltrada);
  }

  return resultado;
}

export function aplicarFiltroMediaPorBloques(
  data: number[][],
  bloqueSize: number = 50,
): number[][] {
  const filtrado: number[][] = [];

  for (let i = 0; i < data.length; i += bloqueSize) {
    const bloque = data.slice(i, i + bloqueSize);

    // Calcular la media para cada canal
    const medias: number[] = [];
    for (let canal = 0; canal < 8; canal++) {
      const valores = bloque
        .map((row) => row[canal])
        .filter((val) => val !== undefined);
      const suma = valores.reduce((acc, val) => acc + val, 0);
      const media = valores.length > 0 ? suma / valores.length : 0;
      medias.push(media);
    }

    // Restar la media a cada valor del bloque
    const bloqueFiltrado = bloque.map((row) =>
      row.map((valor, canal) => valor - medias[canal]),
    );

    filtrado.push(...bloqueFiltrado);
  }

  return filtrado;
}

export function aplicarFiltroMedianaPorBloques(
  data: number[][],
  bloqueSize: number = 50,
): number[][] {
  const filtrado: number[][] = [];

  for (let i = 0; i < data.length; i += bloqueSize) {
    const bloque = data.slice(i, i + bloqueSize);

    // Para cada canal (columna)
    const medianas: number[] = [];
    for (let canal = 0; canal < 8; canal++) {
      const valores = bloque
        .map((row) => row[canal])
        .filter((val) => val !== undefined);
      const mediana = calcularMediana(valores);
      medianas.push(mediana);
    }

    // Restar la mediana a cada valor del bloque
    const bloqueFiltrado = bloque.map((row) =>
      row.map((valor, canal) => valor - medianas[canal]),
    );

    filtrado.push(...bloqueFiltrado);
  }

  return filtrado;
}

// Función auxiliar para calcular la mediana
function calcularMediana(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const medio = Math.floor(n / 2);

  if (n === 0) return 0;

  return n % 2 === 0 ? (sorted[medio - 1] + sorted[medio]) / 2 : sorted[medio];
}

export function filterHighPassButterworth(signals: number[][]): number[][] {
  const sampleRate = 500; // Hz
  const cutoffFreq = 0.5; // Hz

  // Cálculo de coeficientes del filtro Butterworth paso alto de segundo orden
  const calcCoefficients = (fc: number, fs: number) => {
    const omega = (2 * Math.PI * fc) / fs;
    const cos_omega = Math.cos(omega);
    const sin_omega = Math.sin(omega);
    const alpha = sin_omega / (2 * Math.sqrt(2)); // Q = sqrt(2)/2 for Butterworth

    const b0 = (1 + cos_omega) / 2;
    const b1 = -(1 + cos_omega);
    const b2 = (1 + cos_omega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cos_omega;
    const a2 = 1 - alpha;

    // Normalizar coeficientes
    return {
      b: [b0 / a0, b1 / a0, b2 / a0],
      a: [1, a1 / a0, a2 / a0],
    };
  };

  const { b, a } = calcCoefficients(cutoffFreq, sampleRate);

  // Aplicar el filtro a una sola señal
  const applyFilter = (signal: number[]): number[] => {
    const y: number[] = [];

    let x1 = 0,
      x2 = 0;
    let y1 = 0,
      y2 = 0;

    for (let i = 0; i < signal.length; i++) {
      const x0 = signal[i];
      const y0 = b[0] * x0 + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;

      y.push(y0);

      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }

    return y;
  };

  // Aplicar a todas las señales
  return signals.map((signal) => applyFilter(signal));
}

export function filterLowPassButterworth(signals: number[][]): number[][] {
  const sampleRate = 500; // Hz
  const cutoffFreq = 160; // Hz

  // Cálculo de coeficientes del filtro Butterworth paso bajo de segundo orden
  const calcCoefficients = (fc: number, fs: number) => {
    const omega = (2 * Math.PI * fc) / fs;
    const cos_omega = Math.cos(omega);
    const sin_omega = Math.sin(omega);
    const alpha = sin_omega / (2 * Math.sqrt(2)); // Q = sqrt(2)/2 for Butterworth

    const b0 = (1 - cos_omega) / 2;
    const b1 = 1 - cos_omega;
    const b2 = (1 - cos_omega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cos_omega;
    const a2 = 1 - alpha;

    // Normalizar coeficientes
    return {
      b: [b0 / a0, b1 / a0, b2 / a0],
      a: [1, a1 / a0, a2 / a0],
    };
  };

  const { b, a } = calcCoefficients(cutoffFreq, sampleRate);

  // Función para aplicar el filtro a una sola señal
  const applyFilter = (signal: number[]): number[] => {
    const y: number[] = [];

    let x1 = 0,
      x2 = 0;
    let y1 = 0,
      y2 = 0;

    for (let i = 0; i < signal.length; i++) {
      const x0 = signal[i];
      const y0 = b[0] * x0 + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;

      y.push(y0);

      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }

    return y;
  };

  return signals.map((signal) => applyFilter(signal));
}

export function filterNotch50Hz(signals: number[][]): number[][] {
  const sampleRate = 500; // Hz
  const notchFreq = 50; // Hz (frecuencia de rechazo)
  const Q = 50; // Factor de calidad (más alto = más estrecho)

  // Cálculo de coeficientes del filtro notch
  const calcNotchCoefficients = (f0: number, fs: number, Q: number) => {
    const omega = (2 * Math.PI * f0) / fs;
    const alpha = Math.sin(omega) / (2 * Q);
    const cos_omega = Math.cos(omega);

    const b0 = 1;
    const b1 = -2 * cos_omega;
    const b2 = 1;
    const a0 = 1 + alpha;
    const a1 = -2 * cos_omega;
    const a2 = 1 - alpha;

    // Normalizar coeficientes
    return {
      b: [b0 / a0, b1 / a0, b2 / a0],
      a: [1, a1 / a0, a2 / a0],
    };
  };

  const { b, a } = calcNotchCoefficients(notchFreq, sampleRate, Q);

  // Aplicar el filtro a una sola señal
  const applyFilter = (signal: number[]): number[] => {
    const y: number[] = [];

    let x1 = 0,
      x2 = 0;
    let y1 = 0,
      y2 = 0;

    for (let i = 0; i < signal.length; i++) {
      const x0 = signal[i];
      const y0 = b[0] * x0 + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;

      y.push(y0);

      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }

    return y;
  };

  return signals.map((signal) => applyFilter(signal));
}
