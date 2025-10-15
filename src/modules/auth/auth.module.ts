import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { Auth0TokenService } from './service/auth0-token.service';
import { UserService } from '../user/service/user.service';
import { TenantService } from '../tenant/service/tenant.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, Auth0TokenService, UserService, TenantService],
})
export class AuthModule {}
