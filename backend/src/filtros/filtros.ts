export class Filtros {
  // 🔹 Filtro Pasa Bajos Butterworth
  static calculateButterworthCoefficients(
    cutoffFrequency: number,
    samplingFrequency: number,
  ): number[] {
    const w0 = (2 * Math.PI * cutoffFrequency) / samplingFrequency;
    const Q = 1 / Math.sqrt(2);
    const alpha = Math.sin(w0) / (2 * Q);

    return [
      (1 - Math.cos(w0)) / 2,
      1 - Math.cos(w0),
      (1 - Math.cos(w0)) / 2,
      -2 * Math.cos(w0),
      1 - alpha,
    ];
  }

  static lowPassButterworthFilter(
    input: number[],
    coefficients: number[],
  ): number[] {
    const output: number[] = [];
    let x = [0, 0, 0];
    let y = [0, 0, 0];

    input.forEach((value) => {
      x = [value, x[0], x[1]];
      y = [
        coefficients[0] * x[0] +
          coefficients[1] * x[1] +
          coefficients[2] * x[2] -
          coefficients[3] * y[1] -
          coefficients[4] * y[2],
        y[0],
        y[1],
      ];
      output.push(y[0]);
    });

    return output;
  }

  // 🔹 Filtro Pasa Altos Butterworth
  static calculateHighPassButterworthCoefficients(
    cutoffFrequency: number,
    samplingFrequency: number,
  ): number[] {
    const w0 = (2 * Math.PI * cutoffFrequency) / samplingFrequency;
    const Q = 1 / Math.sqrt(2);
    const alpha = Math.sin(w0) / (2 * Q);

    return [
      (1 + Math.cos(w0)) / 2,
      -(1 + Math.cos(w0)),
      (1 + Math.cos(w0)) / 2,
      -2 * Math.cos(w0),
      1 - alpha,
    ];
  }

  static highPassButterworthFilter(
    input: number[],
    coefficients: number[],
  ): number[] {
    return Filtros.lowPassButterworthFilter(input, coefficients);
  }

  // 🔹 Filtro Notch para eliminar interferencias (Ej: 50Hz)
  static calculateNotchCoefficients(
    centerFrequency: number,
    samplingFrequency: number,
    Q: number,
  ): number[] {
    const w0 = (2 * Math.PI * centerFrequency) / samplingFrequency;
    const alpha = Math.sin(w0) / (2 * Q);

    return [1, -2 * Math.cos(w0), 1, -2 * Math.cos(w0), 1 - alpha];
  }

  static notchFilter(input: number[], coefficients: number[]): number[] {
    return Filtros.lowPassButterworthFilter(input, coefficients);
  }

  // 🔹 Quitar Offset usando la Mediana
  static quitarOffsetMediana(column: number[]): number[] {
    const sortedColumn = [...column].sort((a, b) => a - b);
    const median =
      column.length % 2 === 0
        ? (sortedColumn[column.length / 2] +
            sortedColumn[column.length / 2 - 1]) /
          2
        : sortedColumn[Math.floor(column.length / 2)];

    return column.map((value) => value - median);
  }

  // 🔹 Redondear valores cercanos a 0
  static redondearA0(column: number[], threshold: number): number[] {
    return column.map((value) => (Math.abs(value) < threshold ? 0 : value));
  }

  // 🔹 Media de los datos (promedio)
  static promedio(column: number[]): number[] {
    if (column.length === 0) return [];
    const mean = column.reduce((sum, val) => sum + val, 0) / column.length;
    return column.map((value) => value - mean);
  }

  // 🔹 Aplicar todos los filtros en un solo paso
  static aplicarFiltros(
    column: number[],
    samplingFrequency: number,
    cutoffLow: number,
    cutoffHigh: number,
    notchFrequency: number,
    threshold: number,
  ): number[] {
    const lowPassCoeffs = Filtros.calculateButterworthCoefficients(
      cutoffLow,
      samplingFrequency,
    );
    const highPassCoeffs = Filtros.calculateHighPassButterworthCoefficients(
      cutoffHigh,
      samplingFrequency,
    );
    const notchCoeffs = Filtros.calculateNotchCoefficients(
      notchFrequency,
      samplingFrequency,
      30,
    );

    let filteredColumn = column;

    filteredColumn = Filtros.lowPassButterworthFilter(
      filteredColumn,
      lowPassCoeffs,
    );
    filteredColumn = Filtros.highPassButterworthFilter(
      filteredColumn,
      highPassCoeffs,
    );
    filteredColumn = Filtros.notchFilter(filteredColumn, notchCoeffs);

    filteredColumn = Filtros.quitarOffsetMediana(filteredColumn);
    filteredColumn = Filtros.redondearA0(filteredColumn, threshold);

    return filteredColumn;
  }
}
