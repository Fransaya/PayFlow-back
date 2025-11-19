import { Module } from '@nestjs/common';
import { NotificationController } from './controller/notification.controller';
import { NotificationService } from './service/notification.service';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/service/google-token.service';
import { EmailService } from '@src/messaging/services/email.service';
import { UserBusinessService } from '../userBusiness/services/userBusiness.service';
import { TenantService } from '../tenant/service/tenant.service';
import { UserOwnerService } from '../userOwner/services/userOwner.service';

@Module({
    imports: [AuthModule],
    controllers: [NotificationController],
    providers: [
        NotificationService,
        GoogleTokenService,
        EmailService,
        UserBusinessService,
        TenantService,
        UserOwnerService,
    ],
    exports: [NotificationService],
})
export class NotificationModule {}