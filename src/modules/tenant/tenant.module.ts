import { Module } from '@nestjs/common';
import { TenantController } from './controller/tenant.controller';
import { TenantService } from './service/tenant.service';
import { GoogleTokenService } from '../auth/service/google-token.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService, GoogleTokenService],
})
export class TenantModule {}
