export function convertirADCaMicrovoltios(valorADC: number): number {
  const factor = (2.5 * 1e6) / (32768 * 3600);
  return valorADC * factor;
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
  if (!datos || datos.length === 0) {
    console.warn('🚨 Datos vacíos');
    return [];
  }

  const filtros = Array.from(
    { length: 8 },
    () => new IIRFilter('notch', sampleRate, 2, frecuenciaObjetivo),
  );

  try {
    const filtrado = datos.map((muestra, idx) => {
      if (!Array.isArray(muestra) || muestra.length !== 8) {
        console.warn(`⚠️ Muestra inválida en índice ${idx}:`, muestra);
        return new Array(8).fill(0); // o puedes omitirla con `return null`
      }
      return muestra.map((valor, canal) => filtros[canal].process(valor));
    });

    return filtrado;
  } catch (e) {
    console.error('❌ Error aplicando filtro:', e);
    return [];
  }
}
