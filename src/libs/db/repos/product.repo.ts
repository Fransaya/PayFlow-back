import { Prisma } from '@prisma/client';

export function productRepo(tx: Prisma.TransactionClient) {
  return {
    async getProductByTenant(tenant_id: string) {
      return tx.product.findMany({
        where: { tenant_id },
      });
    },

    async getProductById(product_id: string) {
      return tx.product.findUnique({
        where: { product_id },
      });
    },

    async createProduct(data: {
      tenant_id: string;
      category_id: string;
      name: string;
      description?: string;
      price: number;
      currency: string;
      stock: number;
      image_url?: string;
      visible: boolean;
    }) {
      return tx.product.create({
        data,
      });
    },

    async updateProduct(
      product_id: string,
      data: {
        category_id?: string;
        name?: string;
        description?: string;
        price?: number;
        currency?: string;
        stock?: number;
        image_url?: string;
        visible?: boolean;
      },
    ) {
      return tx.product.update({
        where: { product_id },
        data,
      });
    },

    async deleteProduct(product_id: string) {
      return tx.product.delete({
        where: { product_id },
      });
    },
  };
}
