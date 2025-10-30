import { Module } from '@nestjs/common';
import { ProductController } from './controller/product.controller';
import { ProductService } from './service/product.service';
import { Auth0TokenService } from '../auth/service/auth0-token.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, Auth0TokenService],
})
export class ProductModule {}
