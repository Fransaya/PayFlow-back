import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export const RedisProvider = {
  provide: 'Redis',
  useFactory: (configService: ConfigService) => {
    const redisUrl =
      configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const redis = new Redis(redisUrl, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 5,
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    return redis;
  },
  inject: [ConfigService],
};
