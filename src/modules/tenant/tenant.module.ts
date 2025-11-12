import { Module } from '@nestjs/common';
import { TenantController } from './controller/tenant.controller';
import { TenantService } from './service/tenant.service';
import { GoogleTokenService } from '../auth/service/google-token.service';
import { AuthModule } from '../auth/auth.module'; // Importar AuthModule en lugar de AuthService directamente

@Module({
  imports: [AuthModule], // Importar AuthModule para tener acceso a AuthService
  controllers: [TenantController],
  providers: [TenantService, GoogleTokenService],
  exports: [TenantService],
})
export class TenantModule {}
