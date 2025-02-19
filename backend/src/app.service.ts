import { Injectable } from '@nestjs/common';
import Redis from 'ioredis'; // Aquí importamos la clase Redis correctamente

@Injectable()
export class AppService {
  private redisClient: Redis; // Ahora Redis es la instancia del cliente

  constructor() {
    // Configuración de Redis desde .env o valores por defecto
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || '',
    });
  }

  // Método para obtener los valores de Redis usando los parámetros recibidos
  async getHexValues(proyectoId: string, usuarioId: string): Promise<string[]> {
    try {
      // Leemos los últimos 100 datos de Redis (por ejemplo)
      const redisKey = `proyecto:${proyectoId}:${usuarioId}:datos`;
      const rawData = await this.redisClient.lrange(redisKey, -100, -1);

      return rawData;
    } catch (error) {
      console.error('Error al obtener los datos de Redis:', error);
      throw new Error('Error al obtener los datos');
    }
  }
}
