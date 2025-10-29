import { Module } from '@nestjs/common';
import { ProductVariantService } from './services/productVariant.service';
import { ProductVariantController } from './controller/productVariant.controller';
import { Auth0TokenService } from '../auth/service/auth0-token.service';

@Module({
  controllers: [ProductVariantController],
  providers: [ProductVariantService, Auth0TokenService],
  exports: [ProductVariantService],
})
export class ProductVariantModule {}
