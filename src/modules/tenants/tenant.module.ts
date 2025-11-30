import { Module, forwardRef } from '@nestjs/common';
import { TenantController } from './controllers/tenant.controller';
import { TenantService } from './services/tenant.service';
import { GoogleTokenService } from '../auth/services/google-token.service';
import { AuthModule } from '../auth/auth.module';
import { StorageService } from '@src/storage/storage.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [TenantController],
  providers: [TenantService, GoogleTokenService, StorageService],
  exports: [TenantService],
})
export class TenantModule {}
