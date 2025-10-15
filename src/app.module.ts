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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [authConfig] }),
    MessagingModule,
    AuthModule,
    DbModule,
  ],
  controllers: [AppController],
  providers: [AppService, DbService, UserService],
})
export class AppModule {}
