import { Module } from '@nestjs/common';
import { UserBusinessController } from './controllers/userBusiness.controller';
import { UserBusinessService } from './services/userBusiness.service';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/services/google-token.service';

@Module({
  imports: [AuthModule],
  controllers: [UserBusinessController],
  providers: [UserBusinessService, GoogleTokenService],
  exports: [UserBusinessService],
})
export class UserBusinessModule {}
