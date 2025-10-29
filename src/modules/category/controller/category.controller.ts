import {
  Get,
  Post,
  Delete,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
  UseFilters,
  Controller,
} from '@nestjs/common';

import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { Auth0TokenGuard } from '@src/guards/auth0-token.guard';

import { ApiTags } from '@nestjs/swagger';

import { CategoryService } from '../service/category.service';

@ApiTags('Category')
@Controller('category')
@UseFilters(HttpExceptionFilter)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(Auth0TokenGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getCategoriesByTenant(
    @Query('tenantId') tenantId: string,
  ): Promise<any> {
    return await this.categoryService.getCategoriesByTenant(tenantId);
  }

  @Post('create')
  @UseGuards(Auth0TokenGuard)
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
    },
  ): Promise<any> {
    return await this.categoryService.createCategory(body);
  }
  @Patch('update')
  @UseGuards(Auth0TokenGuard)
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
    @Query('categoryId') category_id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      active?: boolean;
    },
  ): Promise<any> {
    return await this.categoryService.updateCategory(category_id, body);
  }

  @Delete('delete')
  @UseGuards(Auth0TokenGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async deleteCategory(@Query('categoryId') category_id: string): Promise<any> {
    return await this.categoryService.deleteCategory(category_id);
  }
}
