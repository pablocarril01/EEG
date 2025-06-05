// backend/src/redis/redis.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisProvider {
  private readonly logger = new Logger(RedisProvider.name);
  public readonly redisClient: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    // Leemos REDIS_HOST, REDIS_PORT, REDIS_PASSWORD del mismo `.env`
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    this.redisClient = createClient({
      socket: {
        host,
        port,
      },
      // Si password está vacío o undefined, la API ignora la propiedad
      password: password || undefined,
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`❌ Redis error: ${err}`);
    });
  }

  async connect(): Promise<void> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
      this.logger.log('✅ Conectado a Redis');
    }
  }

  async getData(proyectoId: string, usuarioId: string): Promise<string[]> {
    const key = `proyecto:${proyectoId}:${usuarioId}:datos`;
    try {
      await this.connect();
      const data = await this.redisClient.lRange(key, -10, -1);
      this.logger.log(
        `✅ Últimos datos de Redis (${key}): ${JSON.stringify(data)}`,
      );
      return data;
    } catch (err) {
      this.logger.error(`❌ Error obteniendo datos de Redis (${key}): ${err}`);
      return [];
    }
  }

  async getComentarios(
    proyectoId: string,
    usuarioId: string,
  ): Promise<string[]> {
    const key = `proyecto:${proyectoId}:${usuarioId}:comentarios`;
    try {
      await this.connect();
      const comentarios = await this.redisClient.lRange(key, -10, -1);
      this.logger.log(
        `✅ Últimos comentarios de Redis (${key}): ${JSON.stringify(comentarios)}`,
      );
      return comentarios;
    } catch (err) {
      this.logger.error(
        `❌ Error obteniendo comentarios de Redis (${key}): ${err}`,
      );
      return [];
    }
  }
}
