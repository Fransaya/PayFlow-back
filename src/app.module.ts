/* eslint-disable import/no-unresolved */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { MessagingModule } from '@messaging/messaging.module';
import { AuthModule } from '@modules/auth/auth.module';

import { DbModule, DbService } from '@libs/db';
import { UserService } from './modules/user/service/user.service';
import authConfig from '@config/auth.config';
import { TenantModule } from './modules/tenant/tenant.module';
import { BusinessModule } from './modules/business/business.module';
import { ProductVariantModule } from './modules/productVariant/productVariant.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { UserOwnerModule } from './modules/userOwner/userOwner.module';
import { UserBusinessModule } from './modules/userBusiness/userBusiness.module';

// Modulo de notificaciones ( funcionalidad de nivel 1)
import { NotificationModule } from './modules/notifications/notification.module';
import { RoleModule } from './modules/roles/role.module';

// Modulo de pagos ( funcionalidad de nivel 2)
import { MercadoPagoModule } from './payments/MercadoPago/mercado-pago.module';

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
  ],
  controllers: [AppController],
  providers: [AppService, DbService, UserService],
})
export class AppModule {}
