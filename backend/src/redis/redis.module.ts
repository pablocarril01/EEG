import { Module } from '@nestjs/common';
import { redisClient } from './redis.provider';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useValue: redisClient,
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
