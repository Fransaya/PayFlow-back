/* eslint-disable import/no-unresolved */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { MessagingModule } from '@messaging/messaging.module';
import { AuthModule } from '@modules/auth/auth.module';

import { DbModule, DbService } from '@libs/db';
import { UserService } from './modules/users/services/user.service';
import authConfig from '@config/auth.config';
import { TenantModule } from './modules/tenants/tenant.module';
import { BusinessModule } from './modules/business/business.module';
import { ProductVariantModule } from './modules/productVariants/productVariant.module';
import { CategoryModule } from './modules/categories/category.module';
import { ProductModule } from './modules/products/product.module';
import { UserOwnerModule } from './modules/userOwner/userOwner.module';
import { UserBusinessModule } from './modules/userBusiness/userBusiness.module';

// Modulo de notificaciones ( funcionalidad de nivel 1)
import { NotificationModule } from './modules/notifications/notification.module';
import { RoleModule } from './modules/roles/role.module';

// Modulo de pagos ( funcionalidad de nivel 2)
import { MercadoPagoModule } from './payments/MercadoPago/mercado-pago.module';
import { OrderModule } from './modules/orders/order.module';
import { PaymentModule } from './payments/payment.module';
import { WebhookMercadoPagoModule } from './webhooks/mercadoPago/public/webhook.mercadopago.module';
import { ConfigModule as ConfigInternalModule } from './modules/config/config.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SystemFlagsModule } from './modules/systemFlags/system-flags.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [authConfig] }),
    MessagingModule,
    MercadoPagoModule,
    RoleModule,
    NotificationModule,
    AuthModule,
    DbModule,
    TenantModule,
    BusinessModule,
    ProductVariantModule,
    CategoryModule,
    ProductModule,
    UserOwnerModule,
    UserBusinessModule,
    OrderModule,
    PaymentModule,
    WebhookMercadoPagoModule,
    ConfigInternalModule,
    AnalyticsModule,
    SystemFlagsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DbService, UserService],
})
export class AppModule {}
