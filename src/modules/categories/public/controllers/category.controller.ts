import { Controller, Get, Param } from '@nestjs/common';

import { CategoryService } from '../services/category.service';

@Controller('categories/public')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get(':tenantId/all')
  async getAllCategories(
    @Param('tenantId') tenantId: string,
    @Param('page') page: number,
    @Param('limit') limit: number,
    @Param('search') search: string,
    @Param('order') order: 'ASC' | 'DESC',
  ) {
    return this.categoryService.getAllCategoriesForBusiness(tenantId, {
      page,
      limit,
      search,
      order,
    });
  }
}
