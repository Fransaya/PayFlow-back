import { Module } from '@nestjs/common';
import { CategoryController } from './controller/category.controller';
import { CategoryService } from './service/category.service';
import { GoogleTokenService } from '../auth/service/google-token.service';

@Module({
  providers: [CategoryService, GoogleTokenService],
  controllers: [CategoryController],
})
export class CategoryModule {}
