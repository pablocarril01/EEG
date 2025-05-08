import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { Server } from 'socket.io';

@Injectable()
export class EmisionAutomaticaService implements OnModuleInit {
  private server: Server;
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: 6379,
    });
  }

  setServer(server: Server) {
    this.server = server;
  }

  onModuleInit() {
    setInterval(() => this.emitirDatosPeriodicamente(), 3000);
  }

  private async emitirDatosPeriodicamente() {
    const usuarios = ['Pablo', 'Ernesto', '1', '2', '4'];

    for (const usuario of usuarios) {
      const datos = await this.obtenerDatosDesdeRedis(usuario);
      const comentarios = [`Comentario para ${usuario}`];

      if (this.server) {
        this.server.to(usuario).emit('nuevoDato', { datos, comentarios });
        console.log(`📤 Emitido a ${usuario}:`, datos);
      }
    }
  }

  private async obtenerDatosDesdeRedis(usuario: string): Promise<number[][]> {
    const rawData = await this.redis.get(`PEPI:${usuario}`);
    if (!rawData) return [[0, 0, 0, 0, 0, 0, 0, 0]];

    try {
      return JSON.parse(rawData);
    } catch (e) {
      console.error('❌ Error parseando datos:', e);
      return [[0, 0, 0, 0, 0, 0, 0, 0]];
    }
  }
}
