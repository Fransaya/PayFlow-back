import {
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  UseFilters,
  Controller,
  Put,
} from '@nestjs/common';

import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';

import { ApiTags } from '@nestjs/swagger';

import { CategoryService } from '../services/category.service';
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';
import { UserFromJWT } from '@src/types/userFromJWT';

@ApiTags('Category')
@Controller('category')
@UseFilters(HttpExceptionFilter)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getCategoriesByTenant(@CurrentUser() user: UserFromJWT): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.categoryService.getCategoriesByTenant(tenantId);
  }

  @Post('create')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseFilters(HttpExceptionFilter)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async createCategory(
    @Body()
    body: {
      tenant_id: string;
      name: string;
      description?: string;
      active: boolean;
      image_key?: string;
    },
    @CurrentUser() user: UserFromJWT,
  ): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.categoryService.createCategory(body, tenantId);
  }
  @Put('update')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateCategory(
    @Body()
    body: {
      category_id: string;
      name?: string;
      description?: string;
      active?: boolean;
      image_key?: string;
    },
    @CurrentUser() user: UserFromJWT,
  ): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.categoryService.updateCategory(body, tenantId);
  }

  @Put('status')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async deleteCategory(
    @Body()
    body: {
      category_id: string;
      active: boolean;
    },
    @CurrentUser() user: UserFromJWT,
  ): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.categoryService.deleteCategory(body, tenantId);
  }
}
