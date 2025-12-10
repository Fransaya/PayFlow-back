import { Module } from '@nestjs/common';
import { BusinessController as BusinessAdminController } from './admin/controllers/business.controller';
import { BusinessController as BusinessPubliController } from './public/controllers/business.controller';
import { BusinessHourController as BusinessHourAdminController } from './admin/controllers/business-hour.controller';
import { BusinessHourService as BusinessHourAdminService } from './admin/services/business-hour.service';
import { BusinessHourController as BusinessHourPublicController } from './public/controllers/business-hour.controller';
import { BusinessHourService as BusinessHourPublicService } from './public/services/business-hour.service';
import { BusinessService as BusinessAdminService } from './admin/services/business.service';
import { BusinessService as BusinessPublicService } from './public/services/business.service';
import { StorageService } from '@src/storage/storage.service';
import { GoogleTokenService } from '../auth/services/google-token.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    BusinessAdminController,
    BusinessPubliController,
    BusinessHourAdminController,
    BusinessHourPublicController,
  ],
  providers: [
    BusinessAdminService,
    BusinessPublicService,
    BusinessHourAdminService,
    BusinessHourPublicService,
    GoogleTokenService,
    StorageService,
  ],
  exports: [BusinessAdminService],
})
export class BusinessModule {}
