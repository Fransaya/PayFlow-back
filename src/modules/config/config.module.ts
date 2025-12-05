import { Module } from '@nestjs/common';

import { ConfigServiceInternal } from './admin/services/config.service';
import { ConfigController } from './admin/controllers/config.controller';
import { DbModule } from '@src/libs/db/db.module';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/services/google-token.service';

@Module({
  imports: [DbModule, AuthModule],
  providers: [ConfigServiceInternal, GoogleTokenService],
  controllers: [ConfigController],
  exports: [ConfigServiceInternal],
})
export class ConfigModule {}
