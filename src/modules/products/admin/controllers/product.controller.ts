import {
  Get,
  Post,
  Put,
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

import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';

import { ApiTags } from '@nestjs/swagger';

import { ProductService } from '../services/product.service';

import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

import { UserFromJWT } from '@src/types/userFromJWT';

@ApiTags('Product')
@Controller('product')
@UseFilters(HttpExceptionFilter)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getProductsByTenant(
    @CurrentUser() user: UserFromJWT,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('visible') visible?: boolean,
    @Query('category_id') category_id?: string,
    @Query('sort_by') sort_by?: string,
    @Query('order') order?: string,
  ): Promise<any> {
    return await this.productService.getProductsByTenant(user.tenant_id, {
      page,
      limit,
      search,
      visible,
      category_id,
      sort_by,
      order,
    });
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
  async createProduct(
    @Body()
    body: {
      category_id: string;
      name: string;
      description?: string;
      price: number;
      currency: string;
      stock: number;
      image_key: string;
      visible: boolean;
    },
    @CurrentUser() user: UserFromJWT,
  ): Promise<any> {
    return await this.productService.createProduct(body, user.tenant_id);
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
  async updateProduct(
    @Query('productId') product_id: string,
    @Body()
    body: {
      category_id?: string;
      name?: string;
      description?: string;
      price?: number;
      currency?: string;
      stock?: number;
      image_key?: string;
      visible?: boolean;
    },
    @CurrentUser() user: UserFromJWT,
  ): Promise<any> {
    return await this.productService.updateProduct(
      product_id,
      body,
      user.tenant_id,
    );
  }

  @Put('delete')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async deleteProduct(
    @Query('productId') product_id: string,
    @CurrentUser() user: UserFromJWT,
    @Body('visible') visible: boolean,
  ): Promise<any> {
    return await this.productService.deleteProduct(
      product_id,
      user.tenant_id,
      visible,
    );
  }
}
