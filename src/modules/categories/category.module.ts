import { Module } from '@nestjs/common';
import { CategoryController as CategoryAdminController } from './admin/controllers/category.controller';
import { CategoryService as CategoryAdminService } from './admin/services/category.service';
import { CategoryController as CategoryPublicController } from './public/controllers/category.controller';
import { CategoryService as CategoryPublicService } from './public/services/category.service';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/services/google-token.service';
import { StorageService } from '@src/storage/storage.service';

@Module({
  imports: [AuthModule],
  providers: [
    CategoryAdminService,
    CategoryPublicService,
    GoogleTokenService,
    StorageService,
  ],
  controllers: [CategoryAdminController, CategoryPublicController],
})
export class CategoryModule {}
