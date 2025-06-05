import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisProvider } from '../redis/redis.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EegData } from './eeg-data.entity';
import { parseRedisEEG } from './parse-eeg';
import { RedisClientType } from 'redis';

@Injectable()
export class SensorStreamService implements OnModuleInit {
  private readonly logger = new Logger(SensorStreamService.name);

  constructor(
    private readonly redisProvider: RedisProvider,
    @InjectRepository(EegData)
    private readonly eegRepo: Repository<EegData>,
  ) {}

  async onModuleInit() {
    // Ejemplo de IDs; cámbialos por los reales o cárgalos dinámicamente
    const usuarioIds = ['Ernesto', 'Pablo'];

    for (const usuarioId of usuarioIds) {
      const streamKey = `proyecto:PEPI:${usuarioId}:datos_stream`;
      this.listenToStream(streamKey, usuarioId);
    }
  }

  private async listenToStream(streamKey: string, usuarioId: string) {
    let lastId = '$';

    while (true) {
      try {
        const redisClient = await this.getClient();

        // Corrección: separo "streams" y "options"
        const result = await redisClient.xRead(
          // 1) Primer argumento: array de streams (XReadStream[])
          [{ key: streamKey, id: lastId }],
          // 2) Segundo argumento: opciones XReadOptions
          { BLOCK: 0 },
        );

        if (!result || !result.length) {
          continue;
        }

        const entries = result[0].messages;
        for (const message of entries) {
          const fields = message.message as Record<string, string>;
          if (!fields.data) continue;

          const parsedRows = parseRedisEEG(fields.data, usuarioId);
          if (parsedRows.length) {
            await this.eegRepo.save(parsedRows);
            this.logger.log(
              `Guardadas ${parsedRows.length} filas para usuario ${usuarioId}`,
            );
          }
          lastId = message.id;
        }
      } catch (e) {
        this.logger.error(`Error leyendo stream ${streamKey}: ${e}`);
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  }

  // Ahora devolvemos explícitamente RedisClientType
  private async getClient(): Promise<RedisClientType> {
    await this.redisProvider.connect();
    return this.redisProvider.redisClient;
  }
}
