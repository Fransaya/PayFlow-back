import { Module } from '@nestjs/common';
import { TenantController } from './controller/tenant.controller';
import { TenantService } from './service/tenant.service';
import { Auth0TokenService } from '../auth/service/auth0-token.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService, Auth0TokenService],
})
export class TenantModule {}
