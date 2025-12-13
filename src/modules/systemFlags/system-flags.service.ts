import { Injectable, Inject } from '@nestjs/common';
import { DbService } from '../../libs/db/db.service';
import { Redis } from 'ioredis';

@Injectable()
export class SystemFlagsService {
  constructor(
    private readonly prisma: DbService,
    @Inject('Redis') private readonly redis: Redis,
  ) {}

  async getFlag(type: 'admin' | 'public') {
    const redisKey = `sys:maintenance:${type}`;
    // 1. Intentar leer de Redis
    const cached = await this.redis.get(redisKey);
    if (cached !== null) {
      return { is_active: cached === 'true' };
    }
    // 2. Leer de DB
    const flag = await this.prisma.system_flags.findUnique({
      where: { key: `maintenance_${type}` },
    });
    const isActive = flag?.is_active ?? false;
    // 3. Guardar en Redis (TTL 60s)
    await this.redis.set(redisKey, String(isActive), 'EX', 60);
    return { is_active: isActive, message: flag?.message };
  }
}
