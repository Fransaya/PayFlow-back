import { Module } from '@nestjs/common';
import { OrderController as OrderAdminController } from './admin/controllers/order.controller';
import { OrderService as OrderAdminService } from './admin/services/order.service';

import { OrderController as OrderPublicController } from './public/controllers/order.controller';
import { OrderService as OrderPublicService } from './public/services/order.service';

// Servicios externos
import { MercadoPagoService } from '@src/payments/MercadoPago/services/mercado-pago.service';
import { TenantService } from '../tenants/services/tenant.service';
import { StorageService } from '@src/storage/storage.service';
import { PaymentService } from '@src/payments/admin/services/payment.service';

import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/services/google-token.service';

import { NotificationModule } from '../notifications/notification.module';
import { MessagingModule } from '@src/messaging/messaging.module';

@Module({
  controllers: [OrderPublicController, OrderAdminController],
  providers: [
    OrderPublicService,
    OrderAdminService,
    MercadoPagoService,
    TenantService,
    StorageService,
    PaymentService,
    GoogleTokenService,
  ],
  imports: [AuthModule, NotificationModule, MessagingModule],
})
export class OrderModule {}
