import { Module } from '@nestjs/common';
import { BusinessController } from './controller/business.controller';
import { BusinessService } from './services/business.service';
import { GoogleTokenService } from '../auth/service/google-token.service';
import { AuthModule } from '../auth/auth.module'; // Importar AuthModule en lugar de AuthService directamente

@Module({
  imports: [AuthModule], // Importar AuthModule para tener acceso a AuthService
  controllers: [BusinessController],
  providers: [BusinessService, GoogleTokenService],
  exports: [BusinessService],
})
export class BusinessModule {}
