import { Controller, Get, Param } from '@nestjs/common';

import { ProductVariantService } from '../services/productVariant.service';

@Controller('product-variant/public')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Get(':tenantId/:productId')
  async getProductVariantsByProductId(
    @Param('tenantId') tenantId: string,
    @Param('productId') productId: string,
  ): Promise<any> {
    return await this.productVariantService.getProductVariantsByProductId(
      tenantId,
      productId,
    );
  }
}
