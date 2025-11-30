import { Prisma } from '@prisma/client';

export function productVariantRepo(tx: Prisma.TransactionClient) {
  return {
    async getProductVariantByProductId(product_id: string) {
      return tx.product_variant.findMany({
        where: { product_id },
      });
    },

    async createProductVariant(data: {
      product_id: string;
      name: string;
      sku: string;
      price_delta: number;
      stock: number;
      active: boolean;
    }) {
      return tx.product_variant.create({
        data,
      });
    },

    async updateProductVariant(
      product_variant_id: string,
      data: {
        name?: string;
        sku?: string;
        price_delta?: number;
        stock?: number;
        active?: boolean;
      },
    ) {
      return tx.product_variant.update({
        where: { variant_id: product_variant_id },
        data,
      });
    },

    async deleteProductVariant(product_variant_id: string) {
      return tx.product_variant.delete({
        where: { variant_id: product_variant_id },
      });
    },

    // Metodo utilizado para obtener variantes de productos pero desde el carrito public
    async getProductVariantsByProductIds(productIds: string) {
      return tx.product_variant.findMany({
        where: {
          product_id: { in: productIds.split(',') },
          active: true,
        },
      });
    },
  };
}
