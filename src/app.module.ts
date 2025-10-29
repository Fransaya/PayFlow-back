/* eslint-disable import/no-unresolved */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { MessagingModule } from '@messaging/messaging.module';
import { AuthModule } from '@modules/auth/auth.module';

import { DbModule, DbService } from '@libs/db';
// import { UserService } from './modules/user/user/user.service';
import { UserService } from './modules/user/service/user.service';
// import { UserService } from './modules/user/service/user.service';
// import { UserService } from './modules/user/user/user.service';
import authConfig from '@config/auth.config';
import { TenantModule } from './modules/tenant/tenant.module';
import { BusinessModule } from './modules/business/business.module';
import { ProductVariantModule } from './modules/productVariant/productVariant.module';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [authConfig] }),
    MessagingModule,
    AuthModule,
    DbModule,
    TenantModule,
    BusinessModule,
    ProductVariantModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService, DbService, UserService],
})
export class AppModule {}
