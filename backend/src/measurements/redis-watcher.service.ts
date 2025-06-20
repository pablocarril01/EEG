import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Pepi } from '../entities/pepi.entity';
import { AppService } from '../app.service';

@Injectable()
export class RedisWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisWatcherService.name);
  private redisClient: Redis;
  private intervalHandle!: ReturnType<typeof setInterval>;
  private lastRawMap: Map<string, string> = new Map();

  constructor(
    @InjectRepository(Pepi)
    private readonly repo: Repository<Pepi>,
    private readonly appService: AppService,
  ) {
    this.logger.log('🔔 Servicio RedisWatcher instanciado');
    const host = process.env.REDIS_HOST;
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD;
    this.redisClient = new Redis({ host, port, password });
  }

  async onModuleInit() {
    this.logger.log('🟢 onModuleInit() invocado');
    // Iniciar polling cada segundo para detectar nuevos bloques
    this.intervalHandle = setInterval(() => this.checkNewEntries(), 1000);
    this.logger.log(
      'Polling iniciado para detectar nuevos datos en Redis cada 1s',
    );
  }

  private scanKeys(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const keys: string[] = [];
      const stream = this.redisClient.scanStream({
        match: pattern,
        count: 100,
      });
      stream.on('data', (resultKeys: string[]) => {
        keys.push(...resultKeys);
      });
      stream.on('end', () => resolve(keys));
      stream.on('error', (err) => reject(err));
    });
  }

  private async checkNewEntries() {
    try {
      // Obtener todas las claves de datos usando SCAN en lugar de KEYS
      const keys = await this.scanKeys('proyecto:PEPI:*:datos');
      for (const key of keys) {
        const raw = await this.redisClient.lindex(key, -1);
        if (!raw) continue;
        const previous = this.lastRawMap.get(key);
        if (raw === previous) continue; // Sin cambios
        this.lastRawMap.set(key, raw);
        this.logger.log(`Nuevo bloque detectado en clave ${key}`);
        await this.handleNewEntry(key, raw);
      }
    } catch (error) {
      this.logger.error('Error en polling de Redis', error);
    }
  }

  private async handleNewEntry(key: string, raw: string) {
    try {
      const match = /^proyecto:PEPI:(.+):datos$/.exec(key);
      if (!match) return;
      const idPaciente = match[1];

      // Procesar string raw usando AppService
      const muestras = this.appService.processRedisStringDB(raw);
      this.logger.log(`Procesadas ${muestras.length} muestras`);

      // Mapear a filas para la BD
      const baseTs = Date.now();
      const filas = muestras.map((vals, i) => {
        const row = new Pepi();
        row.ts = new Date(baseTs + i * 2);
        row.idPaciente = idPaciente;
        [row.fp1, row.fp2, row.t3, row.t4, row.o1, row.o2, row.c3, row.c4] =
          vals;
        row.evento = false;
        return row;
      });

      await this.repo.insert(filas);
      this.logger.log(
        `Insertadas ${filas.length} muestras para paciente ${idPaciente}`,
      );
    } catch (error) {
      this.logger.error('Error al procesar entrada de Redis', error);
    }
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.logger.log('Polling de Redis detenido');
    }
  }
}
