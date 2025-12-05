import { Module } from '@nestjs/common';
import { NotificationController } from './admin/controllers/notification.controller';
import { NotificationService } from './admin/services/notification.service';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/services/google-token.service';
import { EmailService } from '@src/messaging/services/email.service';
import { UserBusinessService } from '../userBusiness/services/userBusiness.service';
import { TenantService } from '../tenants/services/tenant.service';
import { UserOwnerService } from '../userOwner/services/userOwner.service';
import { StorageService } from '@src/storage/storage.service';

// Modulo y dependencia de server websocket
import { WebSocketGatewayAdmin } from '@src/websocket/admin/WebSocketGateway';

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
    StorageService,
    WebSocketGatewayAdmin,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
