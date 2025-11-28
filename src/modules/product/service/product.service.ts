import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DbService, productRepo } from '@src/libs/db';
import { StorageService } from '@src/storage/storage.service';

// Interface de producto
import { Product } from '@src/types/product';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly storageService: StorageService,
  ) {}

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
      const response: { data: any[]; meta: any } =
        await this.dbService.runInTransaction({ tenantId }, async (tx) => {
          const repo = productRepo(tx);
          return repo.getProductsByTenant(tenantId, params);
        });

      // Transformar image_url (que es un key) a una URL firmada
      if (response && response.data) {
        await Promise.all(
          response.data.map(async (product: Product) => {
            if (product.image_url) {
              product.image_url = await this.storageService.getPresignedGetUrl(
                product.image_url,
              );
            }
          }),
        );
      }

      return response;
    } catch (error) {
      this.logger.error(`Error getting products by tenant: ${error}`);
      throw new InternalServerErrorException(
        'Error getting products by tenant',
      );
    }
  }

  async createProduct(
    data: {
      category_id: string;
      name: string;
      description?: string;
      price: number;
      currency: string;
      stock: number;
      image_key?: string;
      visible: boolean;
    },
    tenantId: string,
  ) {
    try {
      // * Desestructuro el image_key para no guardarla en la base de datos
      const { image_key, ...restData } = data;

      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = productRepo(tx);
          return repo.createProduct({
            ...restData,
            tenant_id: tenantId,
            image_url: image_key || '',
          });
        },
      );

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
      currency?: string;
      stock?: number;
      image_key?: string;
      visible?: boolean;
    },
    tenantId: string,
  ) {
    try {
      // * Desestructuro el image_key para no guardarla en la base de datos
      console.log('product to update', data);
      const { image_key, ...restData } = data;

      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = productRepo(tx);
          return repo.updateProduct(
            product_id,
            { ...restData, image_url: image_key || '' },
            tenantId,
          );
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error updating product: ${error}`);
      throw new InternalServerErrorException('Error updating product');
    }
  }

  async deleteProduct(product_id: string, tenantId: string, visible: boolean) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = productRepo(tx);
          return repo.deleteProduct(product_id, tenantId, visible);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error deleting product: ${error}`);
      throw new InternalServerErrorException('Error deleting product');
    }
  }
}
