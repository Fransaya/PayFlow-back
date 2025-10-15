import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbService } from './db.service';
import { RedisProvider } from './redis.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DbService, RedisProvider],
  exports: [DbService, 'Redis'],
})
export class DbModule {}
