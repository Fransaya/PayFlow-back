import { Module } from '@nestjs/common';

import { ConfigController as ConfigControllerInternalPublic } from './public/controllers/config.controller';
import { ConfigServiceInternal as ConfigServiceInternalPublic } from './public/services/config.service';
import { ConfigServiceInternal as ConfigServiceInternalAdmin } from './admin/services/config.service';
import { ConfigController as ConfigControllerInternalAdmin } from './admin/controllers/config.controller';
import { DbModule } from '@src/libs/db/db.module';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/services/google-token.service';

@Module({
  imports: [DbModule, AuthModule],
  providers: [
    ConfigServiceInternalAdmin,
    GoogleTokenService,
    ConfigServiceInternalPublic,
  ],
  controllers: [ConfigControllerInternalAdmin, ConfigControllerInternalPublic],
  exports: [ConfigServiceInternalAdmin, ConfigServiceInternalPublic],
})
export class ConfigModule {}
