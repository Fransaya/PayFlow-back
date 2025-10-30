import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DbService, productRepo } from '@src/libs/db';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly dbService: DbService) {}

  async getProductsByTenant(
    tenantId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      visible?: boolean;
      category_id?: string;
      sort_by?: string;
      order?: string;
    },
  ) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = productRepo(tx);
        return repo.getProductsByTenant(tenantId, params);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error getting products by tenant: ${error}`);
      throw new InternalServerErrorException(
        'Error getting products by tenant',
      );
    }
  }

  async createProduct(data: {
    tenant_id: string;
    category_id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    stock: number;
    image_url?: string;
    visible: boolean;
  }) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = productRepo(tx);
        return repo.createProduct(data);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error creating product: ${error}`);
      throw new InternalServerErrorException('Error creating product');
    }
  }

  async updateProduct(
    product_id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      active?: boolean;
    },
  ) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = productRepo(tx);
        return repo.updateProduct(product_id, data);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error updating product: ${error}`);
      throw new InternalServerErrorException('Error updating product');
    }
  }

  async deleteProduct(product_id: string) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = productRepo(tx);
        return repo.deleteProduct(product_id);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error deleting product: ${error}`);
      throw new InternalServerErrorException('Error deleting product');
    }
  }
}
