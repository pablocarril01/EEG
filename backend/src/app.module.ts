import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedisModule } from './redis/redis.module'; // <- tu módulo personalizado
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EegGateway } from './gateway/eeg.gateway';

import { EegData } from './stream/eeg-data.entity';
import { SensorStreamService } from './stream/sensor-stream.service';

@Module({
  imports: [
    // 1) Cargar el único .env de project-root/.env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '..', '.env'),
    }),

    // 2) Configurar TypeORM (Postgres/TimescaleDB) con ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [EegData],
        synchronize: true, // solo en desarrollo
      }),
    }),
    TypeOrmModule.forFeature([EegData]),

    // 3) Registrar nuestro RedisModule personalizado
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EegGateway,
    SensorStreamService, // inyectará correctamente RedisProvider
  ],
})
export class AppModule {}
