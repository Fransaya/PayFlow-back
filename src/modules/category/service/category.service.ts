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
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = categoryRepo(tx);
        return repo.getCategoryByTenant(tenantId);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error getting categories by tenant: ${error}`);
      throw new InternalServerErrorException(
        'Error getting categories by tenant',
      );
    }
  }

  async createCategory(data: {
    tenant_id: string;
    name: string;
    description?: string;
    active: boolean;
  }) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = categoryRepo(tx);
        return repo.createCategory(data);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error creating category: ${error}`);
      throw new InternalServerErrorException('Error creating category');
    }
  }

  async updateCategory(
    category_id: string,
    data: {
      name?: string;
      description?: string;
      active?: boolean;
    },
  ) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = categoryRepo(tx);
        return repo.updateCategory(category_id, data);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error updating category: ${error}`);
      throw new InternalServerErrorException('Error updating category');
    }
  }

  async deleteCategory(category_id: string) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = categoryRepo(tx);
        return repo.deleteCategory(category_id);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error deleting category: ${error}`);
      throw new InternalServerErrorException('Error deleting category');
    }
  }
}
