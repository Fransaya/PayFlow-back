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

import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('Product Variant')
@Controller('product-variant')
@UseFilters(HttpExceptionFilter)
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Get()
  @UseGuards(JwtGuard)
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
  async createProductVariant(
    @Body()
    body: {
      product_id: string;
      name: string;
      sku: string;
      price_delta: number;
      stock: number;
      active: boolean;
    },
  ): Promise<any> {
    return await this.productVariantService.createProductVariant({
      product_id: body.product_id,
      name: body.name,
      sku: body.sku,
      price_delta: body.price_delta,
      stock: body.stock,
      active: body.active,
    });
  }

  @Patch('update')
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
  async updateProductVariant(
    @Body()
    body: {
      product_variant_id: string;
      name?: string;
      sku?: string;
      price_delta?: number;
      stock?: number;
      active?: boolean;
    },
  ): Promise<any> {
    return await this.productVariantService.updateProductVariant(
      body.product_variant_id,
      {
        name: body.name,
        sku: body.sku,
        price_delta: body.price_delta,
        stock: body.stock,
        active: body.active,
      },
    );
  }

  @Delete('delete')
  @UseGuards(JwtGuard)
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
