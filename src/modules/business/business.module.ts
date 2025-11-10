import { Module } from '@nestjs/common';
import { BusinessController } from './controller/business.controller';
import { BusinessService } from './services/business.service';
import { GoogleTokenService } from '../auth/service/google-token.service';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, GoogleTokenService],
})
export class BusinessModule {}
