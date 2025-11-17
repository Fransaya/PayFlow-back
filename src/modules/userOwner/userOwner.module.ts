import { Module } from '@nestjs/common';
import { UserOwnerController } from './controller/userOwner.controller';
import { UserOwnerService } from './services/userOwner.service';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/service/google-token.service';
@Module({
  imports: [AuthModule],
  controllers: [UserOwnerController],
  providers: [UserOwnerService, GoogleTokenService],
  exports: [UserOwnerService],
})
export class UserOwnerModule {}
