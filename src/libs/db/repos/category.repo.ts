import { Prisma } from '@prisma/client';

export function categoryRepo(tx: Prisma.TransactionClient) {
  return {
    async getCategoryByTenant(tenant_id: string) {
      return tx.category.findMany({
        where: { tenant_id },
      });
    },

    async createCategory(data: {
      tenant_id: string;
      name: string;
      description?: string;
      active: boolean;
    }) {
      return tx.category.create({
        data,
      });
    },

    async updateCategory(
      category_id: string,
      data: {
        name?: string;
        description?: string;
        active?: boolean;
      },
    ) {
      return tx.category.update({
        where: { category_id },
        data,
      });
    },

    // TODO: ver que eliminaria a nivel de integridad referencial
    async deleteCategory(category_id: string) {
      return tx.category.delete({
        where: { category_id },
      });
    },
  };
}
