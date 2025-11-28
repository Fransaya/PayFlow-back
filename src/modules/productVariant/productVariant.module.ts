import { Module } from '@nestjs/common';
import { ProductVariantService } from './services/productVariant.service';
import { ProductVariantController } from './controller/productVariant.controller';
import { GoogleTokenService } from '../auth/service/google-token.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProductVariantController],
  providers: [ProductVariantService, GoogleTokenService],
  exports: [ProductVariantService],
})
export class ProductVariantModule {}
