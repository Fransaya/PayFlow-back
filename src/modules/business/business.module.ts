import { Module } from '@nestjs/common';
import { BusinessController } from './controller/business.controller';
import { BusinessService } from './services/business.service';
import { Auth0TokenService } from '../auth/service/auth0-token.service';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, Auth0TokenService],
})
export class BusinessModule {}
