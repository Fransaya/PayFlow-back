import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { GoogleTokenService } from './service/google-token.service';
import { UserService } from '../user/service/user.service';
import { TenantService } from '../tenant/service/tenant.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleTokenService, UserService, TenantService],
  exports: [AuthService], // Exportar AuthService para que otros módulos puedan usarlo
})
export class AuthModule {}
