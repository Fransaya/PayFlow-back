import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DbService, productRepo } from '@src/libs/db';

@Injectable()
export class ProductService {
  constructor(private readonly dbService: DbService) {}

  private readonly logger = new Logger(ProductService.name + '-Public');

  async getProductForPublic(
    tenantId: string,
    q: {
      page: number;
      limit: number;
      search?: string;
      category_id?: string;
      sort_by?: string;
      order?: string;
    },
  ) {
    try {
      // Convertir a números enteros (vienen como strings desde query params)
      const page = parseInt(String(q.page), 10) || 1;
      const limit = parseInt(String(q.limit), 10) || 10;

      const queryParams = {
        ...q,
        page: page < 1 ? 1 : page,
        limit: limit < 1 ? 10 : limit,
      };

      const products = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          return await productRepo(tx).getProductsByBusiness(
            tenantId,
            queryParams,
          );
        },
      );

      return {
        ...products,
      };
    } catch (error: any) {
      this.logger.error(`Error getting products for public: ${error}`);
      throw new InternalServerErrorException(
        'Error getting products for public',
      );
    }
  }
}
