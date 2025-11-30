import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';

import { DbService, productVariantRepo } from '@src/libs/db';

@Injectable()
export class ProductVariantService {
  private readonly logger = new Logger(ProductVariantService.name);

  constructor(private readonly dbService: DbService) {}

  async getProductVariantsByProductId(
    tenantId: string,
    productId: string,
  ): Promise<any> {
    try {
      const variantes = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          return await productVariantRepo(tx).getProductVariantsByProductIds(
            productId,
          );
        },
      );
      return variantes;
    } catch (error: any) {
      this.logger.error(
        `Failed to get product variants for productId ${productId} and tenantId ${tenantId}: ${error}`,
      );
      throw new InternalServerErrorException('Failed to get product variants');
    }
  }
}
