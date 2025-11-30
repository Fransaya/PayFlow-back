import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';

import { DbService, categoryRepo } from '@src/libs/db';

import { StorageService } from '@src/storage/storage.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly dbService: DbService,
    private readonly storageService: StorageService,
  ) {}

  private readonly logger = new Logger(CategoryService.name + ' - Public');
  /**
   * q: query params for filtering, pagination, etc.
    q: {
    page: number;
    limit: number;
    search: string;
    order: 'ASC' | 'DESC';
    }
   */
  async getAllCategoriesForBusiness(
    tenantId: string,
    q: {
      page: number;
      limit: number;
      search: string;
      order: 'ASC' | 'DESC';
    },
  ) {
    try {
      if (!tenantId) {
        throw new InternalServerErrorException('Tenant ID is required');
      }

      if (!q.page || q.page < 1) {
        q.page = 1;
      }
      if (!q.limit || q.limit < 1) {
        q.limit = 10;
      }

      const categoriesObtained = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const categoryRepository = categoryRepo(tx);
          return await categoryRepository.getPublicCategoriesByTenant(
            tenantId,
            q,
          );
        },
      );

      if (!categoriesObtained) {
        throw new Error('No categories found');
      }

      // Generate presigned URLs for category images
      const categories = await Promise.all(
        categoriesObtained.map(async (category) => {
          return {
            ...category,
            image_url: category.image_key
              ? await this.storageService.getPresignedGetUrl(category.image_key)
              : null,
          };
        }),
      );

      return categories;
    } catch (error) {
      this.logger.error(`Error getting categories by tenant: ${error}`);
      throw new InternalServerErrorException(
        'Error getting categories by tenant',
      );
    }
  }
}
