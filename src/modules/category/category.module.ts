import { Module } from '@nestjs/common';
import { CategoryController } from './controller/category.controller';
import { CategoryService } from './service/category.service';
import { AuthModule } from '../auth/auth.module';
import { GoogleTokenService } from '../auth/service/google-token.service';
import { StorageService } from '@src/storage/storage.service';

@Module({
  imports: [AuthModule],
  providers: [CategoryService, GoogleTokenService, StorageService],
  controllers: [CategoryController],
})
export class CategoryModule {}
