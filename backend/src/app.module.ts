import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { EegGateway } from './gateway/eeg.gateway';

@Module({
  imports: [RedisModule],
  controllers: [AppController],
  providers: [AppService, EegGateway],
})
export class AppModule {}
