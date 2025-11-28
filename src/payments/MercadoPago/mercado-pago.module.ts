import { Module } from '@nestjs/common';
import { MercadoPagoService } from './services/mercado-pago.service';
import { MercadoPagoController } from './controller/mercado-pago.controller';
import { AuthModule } from '@src/modules/auth/auth.module';
import { GoogleTokenService } from '@src/modules/auth/service/google-token.service';

@Module({
  imports: [AuthModule],
  providers: [MercadoPagoService, GoogleTokenService],
  controllers: [MercadoPagoController],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
