import {
  Get,
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
  Post,
  Delete,
} from '@nestjs/common';

import { ProductVariantService } from '../services/productVariant.service';

import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { Auth0TokenGuard } from '@src/guards/auth0-token.guard';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('Product Variant')
@Controller('product-variant')
@UseFilters(HttpExceptionFilter)
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Get()
  @UseGuards(Auth0TokenGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getProductVariants(
    @Query('productId') productId: string,
  ): Promise<any> {
    return await this.productVariantService.getProductVariantsByProductId(
      productId,
    );
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
  async createProductVariant(
    @Body()
    body: {
      product_id: string;
      name: string;
      sku: string;
      price: number;
      stock: number;
      active: boolean;
    },
  ): Promise<any> {
    return await this.productVariantService.createProductVariant({
      product_id: body.product_id,
      name: body.name,
      sku: body.sku,
      price: body.price,
      stock: body.stock,
      active: body.active,
    });
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
  async updateProductVariant(
    @Body()
    body: {
      product_variant_id: string;
      name?: string;
      sku?: string;
      price?: number;
      stock?: number;
      active?: boolean;
    },
  ): Promise<any> {
    return await this.productVariantService.updateProductVariant(
      body.product_variant_id,
      {
        name: body.name,
        sku: body.sku,
        price: body.price,
        stock: body.stock,
        active: body.active,
      },
    );
  }

  @Delete('delete')
  @UseGuards(Auth0TokenGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async deleteProductVariant(
    @Query('productVariantId') productVariantId: string,
  ): Promise<any> {
    return await this.productVariantService.deleteProductVariant(
      productVariantId,
    );
  }
}
