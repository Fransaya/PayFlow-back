import { Module, forwardRef } from '@nestjs/common';
import { TenantController } from './controllers/tenant.controller';
import { TenantService } from './services/tenant.service';
import { GoogleTokenService } from '../auth/services/google-token.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [TenantController],
  providers: [TenantService, GoogleTokenService],
  exports: [TenantService],
})
export class TenantModule {}
