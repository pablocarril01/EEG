import { Injectable } from '@nestjs/common';
import { RedisProvider } from './redis/redis.provider';

@Injectable()
export class AppService {
  constructor(private readonly redisProvider: RedisProvider) {}

  async getHexValues(
    proyectoId: string,
    usuarioId: string
  ): Promise<number[][]> {
    try {
      const rawData = await this.redisProvider.getData(proyectoId, usuarioId);
      if (!rawData || rawData.length === 0) return [];

      console.log('📌 Datos crudos de Redis:', rawData);

      let processedData: number[][] = [];

      rawData.forEach((entry) => {
        entry = entry.replace(/\s/g, '').replace(/^i|f$/g, ''); // Limpiar caracteres
        const sequences = entry.split(/fi|if/); // Dividir en bloques
        
        sequences.forEach((seq) => {
          const groups = seq.split(';');
          groups.forEach((group) => {
            const hexValues = group.split(',').filter(v => v.length > 0);
            if (hexValues.length === 8) {
              const decimalValues = hexValues.map((hex) => parseInt(hex, 16));
              processedData.push(decimalValues);
            }
          });
        });
      });

      //Reducción de valores
      //processedData = processedData.filter((_, index) => index % 3 === 0);

      return processedData;
    } catch (error) {
      console.error('❌ Error al obtener valores hexadecimales:', error);
      return [];
    }
  }
}
