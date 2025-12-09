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

  /**
   * Extrae la key de Minio de una URL pre-firmada
   * Ejemplo: http://localhost:9000/pedilo/9cc8bd91-0faf-4a29-9cf3-16e14b7b780f/products/8350f2bd.jpeg?params
   * Retorna: 9cc8bd91-0faf-4a29-9cf3-16e14b7b780f/products/8350f2bd.jpeg
   */
  private extractMinioKey(url: string): string {
    try {
      // Si ya es solo una key (no tiene http), la retorna directamente
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return url;
      }

      // Remover query parameters si existen
      const urlWithoutParams = url.split('?')[0];

      // Extraer todo después del nombre del bucket (pedilo)
      // Formato: http://localhost:9000/pedilo/tenant-id/products/file.jpeg
      const bucketName = 'pedilo';
      const bucketIndex = urlWithoutParams.indexOf(`/${bucketName}/`);

      if (bucketIndex === -1) {
        this.logger.warn(
          `No se encontró el bucket '${bucketName}' en la URL: ${url}`,
        );
        return url;
      }

      // Extraer desde después de /pedilo/ hasta el final
      const key = urlWithoutParams.substring(
        bucketIndex + bucketName.length + 2,
      );

      return key;
    } catch {
      this.logger.warn(`Error extrayendo key de Minio de la URL: ${url}`);
      return url; // Retornar la URL original si falla la extracción
    }
  }

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
      const { image_key, ...restData } = data;

      // Extraer solo la key de Minio si viene una URL completa
      const minioKey = image_key ? this.extractMinioKey(image_key) : '';

      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = productRepo(tx);
          return repo.updateProduct(
            product_id,
            { ...restData, image_url: minioKey },
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
