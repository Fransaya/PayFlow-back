import { Module } from '@nestjs/common';
import { ProductVariantController as ProductVariantAdminController } from './admin/controllers/productVariant.controller';
import { ProductVariantService as ProductVariantAdminService } from './admin/services/productVariant.service';
import { ProductVariantController as ProductVariantPublicController } from './public/controllers/productVariant.controller';
import { ProductVariantService as ProductVariantPublicService } from './public/services/productVariant.service';

import { GoogleTokenService } from '../auth/services/google-token.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProductVariantAdminController, ProductVariantPublicController],
  providers: [
    ProductVariantAdminService,
    ProductVariantPublicService,
    GoogleTokenService,
  ],
  exports: [ProductVariantAdminService, ProductVariantPublicService],
})
export class ProductVariantModule {}
