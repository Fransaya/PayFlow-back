import { Prisma } from '@prisma/client';

export function categoryRepo(tx: Prisma.TransactionClient) {
  return {
    async getCategoryByTenant(tenant_id: string) {
      return tx.category.findMany({
        where: { tenant_id },
      });
    },

    async createCategory(
      data: {
        tenant_id: string;
        name: string;
        description?: string;
        active: boolean;
      },
      tenantId: string,
    ) {
      return tx.category.create({
        data: {
          ...data,
          tenant_id: tenantId,
        },
      });
    },

    async updateCategory(
      category_id: string,
      data: {
        name?: string;
        description?: string;
        active?: boolean;
        image_key?: string;
      },
    ) {
      return tx.category.update({
        where: { category_id },
        data,
      });
    },

    //* esto cambiaria el estado unicamente
    async deleteCategory(category_id: string, active: boolean) {
      return tx.category.update({
        data: { active },
        where: { category_id },
      });
    },

    // Metodo publico utilizado por el front-end ( carrito public )
    async getPublicCategoriesByTenant(
      tenant_id: string,
      q: {
        page: number;
        limit: number;
        search: string;
        order: 'ASC' | 'DESC';
      },
    ) {
      const { page, limit, search, order } = q;
      const skip = (page - 1) * limit;

      return tx.category.findMany({
        where: {
          tenant_id,
          active: true,
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        orderBy: { name: order === 'ASC' ? 'asc' : 'desc' },
        skip,
        take: limit,
      });
    },
  };
}
