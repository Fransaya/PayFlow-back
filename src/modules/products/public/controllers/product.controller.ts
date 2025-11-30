import {
  Controller,
  Get,
  Param,
  Query,
  InternalServerErrorException,
} from '@nestjs/common';

import { ProductService } from '../services/product.service';

@Controller('product/public')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':tenantId')
  async getProducts(
    @Param('tenantId') tenantId: string,
    @Query()
    q: {
      page: number;
      limit: number;
      search?: string;
      category_id?: string;
      sort_by?: string;
      order?: string;
    },
  ) {
    if (!tenantId) {
      throw new InternalServerErrorException('Tenant ID is required');
    }
    return this.productService.getProductForPublic(tenantId, q);
  }
}
