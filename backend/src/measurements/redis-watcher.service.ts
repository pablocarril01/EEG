import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Pepi } from '../entities/pepi.entity';

@Injectable()
export class RedisWatcherService implements OnModuleInit {
  private readonly logger = new Logger(RedisWatcherService.name);
  private sub: Redis;
  private pub: Redis;

  constructor(
    @InjectRepository(Pepi)
    private readonly repo: Repository<Pepi>,
  ) {
    this.pub = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    });
    this.sub = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    });
  }

  async onModuleInit() {
    // Enable keyspace notifications for list pushes
    //await this.sub.config('SET', 'notify-keyspace-events', 'Kl');

    // Subscribe to keyspace events on proyecto:PEPI:{paciente}:datos
    await this.sub.psubscribe('__keyspace@0__:proyecto:PEPI:*:datos');
    this.sub.on('pmessage', async (_pattern, channel, event) => {
      if (event === 'rpush' || event === 'lpush') {
        const key = channel.replace('__keyspace@0__:', '');
        await this.handleNewEntry(key);
      }
    });

    this.logger.log('Subscribed to Redis keyspace notifications for EEG data');
  }

  private async handleNewEntry(key: string) {
    try {
      const match = /^proyecto:PEPI:(.+):datos$/.exec(key);
      if (!match) {
        return;
      }
      const patientId = match[1];

      // Get the latest block of samples
      const raw = await this.pub.lindex(key, -1);
      if (!raw) {
        this.logger.warn(`No data found for key ${key}`);
        return;
      }
      const samples: number[][] = JSON.parse(raw);

      const baseTs = Date.now();
      const rows = samples.map((vals, i) => {
        const row = new Pepi();
        row.idPaciente = patientId;
        [row.fp1, row.fp2, row.t3, row.t4, row.o1, row.o2, row.c3, row.c4] = vals;
        row.evento = false;
        row.ts = new Date(baseTs + i * 2);
        return row;
      });

      await this.repo.insert(rows);
      this.logger.debug(`Inserted ${rows.length} samples for patient ${patientId}`);
    } catch (error) {
      this.logger.error('Error processing Redis entry', error);
    }
  }
}
