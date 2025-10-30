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

import { ProductService } from '../service/product.service';

@ApiTags('Product')
@Controller('product')
@UseFilters(HttpExceptionFilter)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @UseGuards(Auth0TokenGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getProductsByTenant(
    @Query('tenantId') tenant_id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('visible') visible?: boolean,
    @Query('category_id') category_id?: string,
    @Query('sort_by') sort_by?: string,
    @Query('order') order?: string,
  ): Promise<any> {
    return await this.productService.getProductsByTenant(tenant_id, {
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
  async createProduct(
    @Body()
    body: {
      tenant_id: string;
      category_id: string;
      name: string;
      description?: string;
      price: number;
      currency: string;
      stock: number;
      image_url?: string;
      visible: boolean;
    },
  ): Promise<any> {
    return await this.productService.createProduct(body);
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
      image_url?: string;
      visible?: boolean;
    },
  ): Promise<any> {
    return await this.productService.updateProduct(product_id, body);
  }

  @Delete('delete')
  @UseGuards(Auth0TokenGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async deleteProduct(@Query('productId') product_id: string): Promise<any> {
    return await this.productService.deleteProduct(product_id);
  }
}
