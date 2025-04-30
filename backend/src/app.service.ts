import { Injectable } from '@nestjs/common';
import { RedisProvider } from './redis/redis.provider';
import {
  restar32768,
  filtroNotch,
  filtroPasoAlto,
  filtroPasoBajo,
  filtroMediana,
  filtroMedia,
} from './filtros/filtros';

@Injectable()
export class AppService {
  private previousData: number[][] = [];

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

      comentarios = comentarios.map((item) => {
        const itemSinAmpersand = item.replace(/&/g, '');
        const partes = itemSinAmpersand.split('$');

        if (partes.length === 2) {
          const fechaUnix = parseInt(partes[0], 10);
          const mensaje = partes[1];

          if (!isNaN(fechaUnix)) {
            const fecha = new Date(fechaUnix * 1000);
            const fechaLegible = fecha
              .toLocaleString('es-ES', {
                timeZone: 'Europe/Madrid',
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

      if (!rawData || rawData.length === 0)
        return { datos: [], comentarios };

      console.log('📌 Datos crudos de Redis:', rawData);

      let newData: number[][] = [];

      rawData.forEach((entry) => {
        entry = entry.replace(/\s/g, '').replace(/^i|f$/g, '');
        const sequences = entry.split(/fi|if/);

        sequences.forEach((seq) => {
          const groups = seq.split(';');
          groups.forEach((group) => {
            const hexValues = group.split(',').filter((v) => v.length > 0);
            if (hexValues.length === 8) {
              const decimalValues = hexValues.map((val) => parseInt(val, 16));
              newData.push(decimalValues);
            }
          });
        });
      });

      const cantidadNuevos = newData.length;

      let processedData = restar32768(newData).filter((f) => f.length === 8);

      processedData = filtroNotch(processedData);
      processedData = filtroPasoAlto(processedData);
      processedData = filtroPasoBajo(processedData);
      processedData = filtroMediana(processedData);
      processedData = filtroMedia(processedData);

      processedData = processedData.slice(-cantidadNuevos);
      processedData = processedData.filter((_, index) => index % 5 === 0);
      processedData = processedData.map((fila) =>
        fila.map((valor) => Number(valor.toFixed(2))),
      );

      this.previousData = processedData.slice(-50);

      return { datos: processedData, comentarios };
    } catch (error) {
      console.error('❌ Error procesando los datos:', error);
      return { datos: [], comentarios: [] };
    }
  }
}
