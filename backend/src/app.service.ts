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
  // Para mantener el historial de los últimos 50 puntos en la UI
  private previousData: number[][] = [];

  constructor(private readonly redisProvider: RedisProvider) {}

  /**
   * Procesa un string crudo de Redis (hexadecimal con marcadores i/f,
   * grupos de 8 valores separados por comas y punto y coma)
   * y devuelve el bloque completo filtrado, listo para persistir en PostgreSQL.
   */
  processRedisStringPG(entry: string): number[][] {
    // 1) Eliminar espacios y marcadores de inicio/fin ('i' y 'f')
    entry = entry.replace(/\s/g, '').replace(/^i|f$/g, '');
    // 2) Dividir por los delimitadores de secuencia 'fi' o 'if'
    const sequences = entry.split(/fi|if/);

    // 3) Extraer cada grupo de 8 valores hexadecimales y convertirlos a decimal
    const rawValues: number[][] = [];
    sequences.forEach((seq) => {
      const groups = seq.split(';');
      groups.forEach((group) => {
        const hexValues = group.split(',').filter((v) => v.length > 0);
        if (hexValues.length === 8) {
          rawValues.push(hexValues.map((val) => parseInt(val, 16)));
        }
      });
    });

    // 4) Aplicar filtros secuenciales
    let processed = restar32768(rawValues).filter((f) => f.length === 8);
    processed = filtroNotch(processed);
    processed = filtroPasoAlto(processed);
    processed = filtroPasoBajo(processed);
    processed = filtroMediana(processed);
    processed = filtroMedia(processed);

    // 5) Extraer solo las muestras nuevas (mismo número que rawValues)
    const count = rawValues.length;
    const processedDataPG = processed.slice(-count);

    return processedDataPG;
  }

  /**
   * Método que utiliza el frontend para obtener datos y comentarios.
   * Reutiliza processRedisStringPG para el bloque completo,
   * decima y redondea los datos para la UI.
   */
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

      // Formatear comentarios con fecha legible
      comentarios = comentarios.map((item) => {
        const clean = item.replace(/&/g, '');
        const parts = clean.split('$');
        if (parts.length === 2) {
          const tsUnix = parseInt(parts[0], 10);
          const mensaje = parts[1];
          if (!isNaN(tsUnix)) {
            const fecha = new Date(tsUnix * 1000);
            const legible = fecha
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
            return `${legible}: ${mensaje}`;
          }
        }
        return `Formato incorrecto en: ${item}`;
      });

      if (!rawData || rawData.length === 0) {
        return { datos: [], comentarios };
      }

      // 6) Procesar cada string raw y concatenar todos los bloques PG
      const allBlocksPG = rawData.flatMap((entry) =>
        this.processRedisStringPG(entry),
      );

      // 7) Decimar (cada 5º muestra) y redondear para la UI
      let datosParaUI = allBlocksPG.filter((_, idx) => idx % 5 === 0);
      datosParaUI = datosParaUI.map((fila) =>
        fila.map((valor) => Number(valor.toFixed(2))),
      );

      // 8) Guardar últimos 50 para el historial en la UI
      this.previousData = datosParaUI.slice(-50);

      return { datos: datosParaUI, comentarios };
    } catch (error) {
      console.error('❌ Error procesando los datos:', error);
      return { datos: [], comentarios: [] };
    }
  }
}
