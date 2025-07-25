import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    return new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  },
};

@Global()
@Module({
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule {}
