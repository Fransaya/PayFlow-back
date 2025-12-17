import { Module } from '@nestjs/common';
import { ProductController as ProductAdminController } from './admin/controllers/product.controller';
import { ProductService as ProductAdminService } from './admin/services/product.service';
import { ProductController as ProductPublicController } from './public/controllers/product.controller';
import { ProductService as ProductPublicService } from './public/services/product.service';
import { GoogleTokenService } from '../auth/services/google-token.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProductAdminController, ProductPublicController],
  providers: [ProductAdminService, ProductPublicService, GoogleTokenService],
})
export class ProductModule {}
