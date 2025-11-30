import { Module } from '@nestjs/common';
import { BusinessController as BusinessAdminController } from './admin/controllers/business.controller';
import { BusinessController as BusinessPubliController } from './public/controllers/business.controller';
import { BusinessService as BusinessAdminService } from './admin/services/business.service';
import { BusinessService as BusinessPublicService } from './public/services/business.service';
import { StorageService } from '@src/storage/storage.service';
import { GoogleTokenService } from '../auth/services/google-token.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BusinessAdminController, BusinessPubliController],
  providers: [
    BusinessAdminService,
    BusinessPublicService,
    GoogleTokenService,
    StorageService,
  ],
  exports: [BusinessAdminService],
})
export class BusinessModule {}
