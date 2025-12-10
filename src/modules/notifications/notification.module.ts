import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotificationController } from './admin/controllers/notification.controller';
import { NotificationService as NotificationAdminService } from './admin/services/notification.service';
import { NotificationService as NotificationPublicService } from './public/services/notification.service';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/services/google-token.service';
import { EmailService } from '@src/messaging/services/email.service';
import { UserBusinessService } from '../userBusiness/services/userBusiness.service';
import { TenantService } from '../tenants/services/tenant.service';
import { UserOwnerService } from '../userOwner/services/userOwner.service';
import { StorageService } from '@src/storage/storage.service';
import { WhatsAppServide } from '@src/messaging/services/whatsapp.service';

// Modulo y dependencia de server websocket
import { WebSocketGatewayAdmin } from '@src/websocket/admin/WebSocketGateway';
import { WebSocketGatewayPublic } from '@src/websocket/public/WebSocketPublicGateway';

@Module({
  imports: [AuthModule, HttpModule],
  controllers: [NotificationController],
  providers: [
    ConfigService,
    NotificationAdminService,
    NotificationPublicService,
    GoogleTokenService,
    EmailService,
    UserBusinessService,
    TenantService,
    UserOwnerService,
    StorageService,
    WhatsAppServide,
    WebSocketGatewayAdmin,
    WebSocketGatewayPublic,
  ],
  exports: [NotificationAdminService, NotificationPublicService],
})
export class NotificationModule {}
