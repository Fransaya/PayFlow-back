import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DbService, productVariantRepo } from '@src/libs/db';

@Injectable()
export class ProductVariantService {
  private readonly logger = new Logger(ProductVariantService.name);

  constructor(private readonly dbService: DbService) {}

  async getProductVariantsByProductId(productId: string) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = productVariantRepo(tx);
        return repo.getProductVariantByProductId(productId);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error getting product variants: ${error}`);
      throw new InternalServerErrorException('Error getting product variants');
    }
  }

  async createProductVariant(data: {
    product_id: string;
    name: string;
    sku: string;
    price_delta: number;
    stock: number;
    active: boolean;
  }) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = productVariantRepo(tx);
        return repo.createProductVariant(data);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error creating product variant: ${error}`);
      throw new InternalServerErrorException('Error creating product variant');
    }
  }

  async updateProductVariant(
    product_variant_id: string,
    data: {
      name?: string;
      sku?: string;
      price_delta?: number;
      stock?: number;
      active?: boolean;
    },
  ) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = productVariantRepo(tx);
        return repo.updateProductVariant(product_variant_id, data);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error updating product variant: ${error}`);
      throw new InternalServerErrorException('Error updating product variant');
    }
  }

  async deleteProductVariant(product_variant_id: string) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = productVariantRepo(tx);
        return repo.deleteProductVariant(product_variant_id);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error deleting product variant: ${error}`);
      throw new InternalServerErrorException('Error deleting product variant');
    }
  }
}
