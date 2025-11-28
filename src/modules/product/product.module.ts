import { Module } from '@nestjs/common';
import { ProductController } from './controller/product.controller';
import { ProductService } from './service/product.service';
import { GoogleTokenService } from '../auth/service/google-token.service';
import { AuthModule } from '../auth/auth.module';
import { StorageService } from '@src/storage/storage.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductController],
  providers: [ProductService, GoogleTokenService, StorageService],
})
export class ProductModule {}
