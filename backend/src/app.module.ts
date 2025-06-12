import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService }    from './app.service';
import { RedisModule }   from './redis/redis.module';
import { DatabaseModule } from './database.module';
import { RedisWatcherService } from './measurements/redis-watcher.service';
import { EegGateway }    from './gateway/eeg.gateway';

@Module({
  imports: [
    RedisModule,      // tu conexión a Redis original :contentReference[oaicite:0]{index=0}
    DatabaseModule,   // configura TypeORM y tu entity 'pepi'
  ],
  controllers: [
    AppController,
  ],
  providers: [
    AppService,
    EegGateway,
    RedisWatcherService,  // suscribe a key-space events y vuelca a Postgres
  ],
})
export class AppModule {}
