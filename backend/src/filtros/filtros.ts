export function convertirADCaMicrovoltios(valorADC: number): number {
  const factor = (2.5 * 1e6) / (32768 * 3600);
  return valorADC * factor;
}

export function calcularMedias(listaDeListas: number[][]): number[] {
  const numElementos = listaDeListas.length;
  if (numElementos === 0) return Array(8).fill(0); // Si la lista está vacía, devuelve un vector de ceros.

  const sumas = Array(8).fill(0); // Inicializa un array de sumas con 8 valores en 0.

  listaDeListas.forEach(lista => {
    lista.forEach((valor, indice) => {
      sumas[indice] += valor; // Suma los valores en sus respectivas posiciones.
    });
  });

  return sumas.map(suma => suma / numElementos); // Calcula las medias dividiendo entre la cantidad de listas.
}

export function restarMedias(listaDeListas: number[][], medias: number[]): number[][] {
  return listaDeListas.map(lista => 
    lista.map((valor, indice) => valor - medias[indice])
  );
}

export function calcularMedianas(listaDeListas: number[][]): number[] {
  const numElementos = listaDeListas.length;
  if (numElementos === 0) return Array(8).fill(0); // Si está vacío, devuelve un vector de ceros.

  const columnas = Array.from({ length: 8 }, (_, i) => 
    listaDeListas.map(lista => lista[i]).sort((a, b) => a - b)
  );

  return columnas.map(columna => {
    const mitad = Math.floor(columna.length / 2);
    return columna.length % 2 === 0
      ? (columna[mitad - 1] + columna[mitad]) / 2 // Promedio de los dos valores centrales
      : columna[mitad]; // Valor central si la longitud es impar
  });
}

export function restarMedianas(listaDeListas: number[][], medianas: number[]): number[][] {
  return listaDeListas.map(lista => 
    lista.map((valor, indice) => valor - medianas[indice])
  );
}