import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DbService, categoryRepo } from '@src/libs/db';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly dbService: DbService) {}

  async getCategoriesByTenant(tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = categoryRepo(tx);
          return repo.getCategoryByTenant(tenantId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error getting categories by tenant: ${error}`);
      throw new InternalServerErrorException(
        'Error getting categories by tenant',
      );
    }
  }

  async createCategory(
    data: {
      tenant_id: string;
      name: string;
      description?: string;
      active: boolean;
      image_key?: string;
    },
    tenantId: string,
  ) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = categoryRepo(tx);
          return repo.createCategory(data, tenantId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error creating category: ${error}`);
      throw new InternalServerErrorException('Error creating category');
    }
  }

  async updateCategory(
    body: {
      category_id: string;
      name?: string;
      description?: string;
      active?: boolean;
      image_key?: string;
    },
    tenantId: string,
  ) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = categoryRepo(tx);
          return repo.updateCategory(body.category_id, body);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error updating category: ${error}`);
      throw new InternalServerErrorException('Error updating category');
    }
  }

  async deleteCategory(
    body: { category_id: string; active: boolean },
    tenantId: string,
  ) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = categoryRepo(tx);
          return repo.deleteCategory(body.category_id, body.active);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error deleting category: ${error}`);
      throw new InternalServerErrorException('Error deleting category');
    }
  }
}
