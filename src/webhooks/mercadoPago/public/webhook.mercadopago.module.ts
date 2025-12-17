import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { WebhookMercadoPagoController } from './controllers/webhook.mercadopago.controller';
import { WebhookMercadoPagoService } from './services/webhook.mercadopago.service';
import { MercadoPagoService } from '@src/payments/MercadoPago/services/mercado-pago.service';
import { DbService } from '@src/libs/db';
import { OrderService as OrderAdminService } from '@src/modules/orders/admin/services/order.service';
import { TenantService } from '@src/modules/tenants/services/tenant.service';
import { PaymentService } from '@src/payments/admin/services/payment.service';
import { NotificationModule } from '@src/modules/notifications/notification.module';
import { WhatsAppServide } from '@src/messaging/services/whatsapp.service';

@Module({
  imports: [HttpModule, NotificationModule],
  controllers: [WebhookMercadoPagoController],
  providers: [
    WebhookMercadoPagoService,
    MercadoPagoService,
    DbService,
    OrderAdminService,
    TenantService,
    PaymentService,
    WhatsAppServide,
  ],
})
export class WebhookMercadoPagoModule {}
