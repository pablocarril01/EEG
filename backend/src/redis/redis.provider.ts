import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

@Injectable()
export class RedisProvider {
  private redisClient;

  constructor() {
    this.redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
      password: process.env.REDIS_PASSWORD || '',
    });

    this.redisClient.on('error', (err) =>
      console.error('❌ Redis error:', err),
    );
  }

  async connect(): Promise<void> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
      console.log('✅ Conectado a Redis');
    }
  }

  async getData(proyectoId: string, usuarioId: string): Promise<string[]> {
    const key = `proyecto:${proyectoId}:${usuarioId}:datos`;
    try {
      await this.connect();
      const data = await this.redisClient.lRange(key, -10, -1);
      //console.log('✅ Últimos datos obtenidos de Redis:', data);
      return data;
    } catch (err) {
      console.error('❌ Error obteniendo datos de Redis:', err);
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
      console.log('✅ Últimos comentarios obtenidos de Redis:', comentarios);
      return comentarios;
    } catch (err) {
      console.error('❌ Error obteniendo comentarios de Redis:', err);
      return [];
    }
  }
}
