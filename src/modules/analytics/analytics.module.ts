import { Module } from '@nestjs/common';
import { DbService } from '@src/libs/db';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/services/google-token.service';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DbService, GoogleTokenService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
