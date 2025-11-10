import { Module } from '@nestjs/common';
import { ProductController } from './controller/product.controller';
import { ProductService } from './service/product.service';
import { GoogleTokenService } from '../auth/service/google-token.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, GoogleTokenService],
})
export class ProductModule {}
