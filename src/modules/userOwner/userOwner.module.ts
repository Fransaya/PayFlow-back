import { Module } from '@nestjs/common';
import { UserOwnerController } from './controllers/userOwner.controller';
import { UserOwnerService } from './services/userOwner.service';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/services/google-token.service';
@Module({
  imports: [AuthModule],
  controllers: [UserOwnerController],
  providers: [UserOwnerService, GoogleTokenService],
  exports: [UserOwnerService],
})
export class UserOwnerModule {}
