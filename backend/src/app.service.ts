import { Injectable } from '@nestjs/common';
import { RedisProvider } from './redis/redis.provider';

@Injectable()
export class AppService {
  constructor(private readonly redisProvider: RedisProvider) {}

  async getHexValues(
    proyectoId: string,
    usuarioId: string,
  ): Promise<number[][]> {
    try {
      const rawData = await this.redisProvider.getData(proyectoId, usuarioId);
      if (!rawData || rawData.length === 0) return [];

      console.log('📌 Datos crudos de Redis:', rawData);

      // 🔹 Convertir los datos en un solo string y limpiar caracteres iniciales/finales
      const combinedString = rawData.join(';').replace(/\s/g, '');
      const cleanedString = combinedString.replace(/^i|f$/g, '');

      // 🔹 Separar los datos en BLOQUES usando "i", "f", "if", "fi" como separadores
      const groups = cleanedString
        .split(/if|fi|i|f/)
        .filter((group) => group.trim() !== '');

      let processedData: number[][] = [];

      // 🔹 Convertir valores hexadecimales a decimales y agrupar en listas de 8 valores
      for (const group of groups) {
        const allValues = group.split(/;|,/).filter((val) => val !== '');
        const decimalValues = allValues.map((hexValue) =>
          parseInt(hexValue, 16),
        );

        if (decimalValues.length >= 8) {
          processedData.push(decimalValues.slice(0, 8)); // Tomar solo las primeras 8 columnas
        }
      }

      console.log(
        '📌 Datos procesados sin aplicar media:',
        JSON.stringify(processedData),
      );

      return processedData; // ✅ Devolver todos los datos sin calcular la media
    } catch (error) {
      console.error('❌ Error en getHexValues:', error);
      throw new Error('No se pudieron obtener los datos de Redis');
    }
  }
}
