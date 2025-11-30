import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { GoogleTokenService } from './services/google-token.service';
import { UserService } from '../users/services/user.service';
import { TenantModule } from '../tenants/tenant.module';

@Module({
  imports: [forwardRef(() => TenantModule)],
  controllers: [AuthController],
  providers: [AuthService, GoogleTokenService, UserService],
  exports: [AuthService], // Exportar AuthService para que otros módulos puedan usarlo
})
export class AuthModule {}
