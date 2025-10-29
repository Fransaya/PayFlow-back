import { Module } from '@nestjs/common';
import { CategoryController } from './controller/category.controller';
import { CategoryService } from './service/category.service';
import { Auth0TokenService } from '../auth/service/auth0-token.service';

@Module({
  providers: [CategoryService, Auth0TokenService],
  controllers: [CategoryController],
})
export class CategoryModule {}
