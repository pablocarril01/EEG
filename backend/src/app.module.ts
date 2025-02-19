import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [RedisModule], // Importamos RedisModule
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
