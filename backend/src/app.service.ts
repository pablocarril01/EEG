import { Injectable } from '@nestjs/common';
import { RedisProvider } from './redis/redis.provider';
import {
  convertirADCaMicrovoltios,
  calcularMedias,
  calcularMedianas,
  restarMedias,
  restarMedianas,
  eliminarSenoideNotch,
} from './filtros/filtros';

@Injectable()
export class AppService {
  constructor(private readonly redisProvider: RedisProvider) {}

  async getProyectoInfo(
    proyectoId: string,
    usuarioId: string,
  ): Promise<{ datos: number[][]; comentarios: string[] }> {
    try {
      const rawData = await this.redisProvider.getData(proyectoId, usuarioId);
      let comentarios = await this.redisProvider.getComentarios(
        proyectoId,
        usuarioId,
      );

      // Procesar cada elemento de la variable "comentarios"
      comentarios = comentarios.map((item) => {
        const itemSinAmpersand = item.replace(/&/g, '');
        const partes = itemSinAmpersand.split('$');

        if (partes.length === 2) {
          const fechaUnix = parseInt(partes[0], 10);
          const mensaje = partes[1];

          if (!isNaN(fechaUnix)) {
            // Convertir a fecha local en España
            const fecha = new Date(fechaUnix * 1000);
            const fechaLegible = fecha
              .toLocaleString('es-ES', {
                timeZone: 'Europe/Madrid', // Ajuste a la zona horaria de España
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
              .replace(',', '');

            return `${fechaLegible}: ${mensaje}`;
          } else {
            return `Error con la fecha en: ${item}`;
          }
        } else {
          return `Formato incorrecto en: ${item}`;
        }
      });

      if (!rawData || rawData.length === 0) return { datos: [], comentarios };

      console.log('📌 Datos crudos de Redis:', rawData);
      console.log('📌 Comentarios crudos de Redis:', comentarios);

      let processedData: number[][] = [];

      rawData.forEach((entry) => {
        entry = entry.replace(/\s/g, '').replace(/^i|f$/g, '');
        const sequences = entry.split(/fi|if/);

        sequences.forEach((seq) => {
          const groups = seq.split(';');
          groups.forEach((group) => {
            const hexValues = group.split(',').filter((v) => v.length > 0);
            if (hexValues.length === 8) {
              const decimalValues = hexValues.map((val) => parseInt(val, 16));
              processedData.push(decimalValues);
            }
          });
        });
      });

      // Inicio de Filtrado de medidas

      /*
      processedData = processedData.map((grupo) =>
        grupo.map((valor) => convertirADCaMicrovoltios(valor)),
      );
      */

      function restar32768(matriz: number[][]): number[][] {
        return matriz.map((fila) => fila.map((valor) => valor - 32768));
      }
      processedData = restar32768(processedData);

      const medias = calcularMedias(processedData);
      console.log(medias);

      const medianas = calcularMedianas(processedData);
      console.log(medianas);

      processedData = restarMedias(processedData, medias);

      //processedData = eliminarSenoideNotch(processedData, 50, 500);

      //      Reducción de valores

      //processedData = processedData.filter((_, index) => index % 2 === 0);
      processedData = processedData.map((fila) =>
        fila.map((valor) => Number(valor.toFixed(2))),
      );

      // Fin de Filtrado de medidas

      return { datos: processedData, comentarios };
    } catch (error) {
      console.error('❌ Error procesando los datos:', error);
      return { datos: [], comentarios: [] };
    }
  }
}
