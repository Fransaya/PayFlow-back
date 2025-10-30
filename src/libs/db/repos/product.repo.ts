import { Prisma } from '@prisma/client';

export function productRepo(tx: Prisma.TransactionClient) {
  return {
    async getProductsByTenant(
      tenant_id: string,
      params?: {
        page?: number;
        limit?: number;
        search?: string;
        visible?: boolean;
        category_id?: string;
        sort_by?: string;
        order?: string;
      },
    ) {
      //* Pagination & Filtering */
      const page = params?.page && params.page > 0 ? params.page : 1;
      const limit = params?.limit && params.limit > 0 ? params.limit : 10;
      const skip = (page - 1) * limit;

      //* Condicion obligatoria por tenant */
      const where: Prisma.productWhereInput = { tenant_id };

      //* Filtro por texto por nombre y descripcion de producto */
      if (params?.search && params.search.trim() !== '') {
        where.OR = [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ];
      }

      //* Filtro de visibilidad de product */
      if (params?.visible !== undefined && params.visible !== null) {
        where.visible = { equals: params.visible };
      }

      //**Filtro de categoria de producto */
      if (params?.category_id !== undefined && params.category_id !== null) {
        where.category_id = { equals: params.category_id };
      }

      //** Lista de parametros permitidos para el ordenamiento */
      const ALLOWED_SORT_FIELDS = new Set([
        'name',
        'price',
        'stock',
        'created_at',
        'product_id',
      ]);

      //* Campo de ordenamiento ( debe estar incluido en ALLOWED_SORT_FIELDS ) */
      const paramSort = params?.sort_by;
      const sortField =
        paramSort && ALLOWED_SORT_FIELDS.has(paramSort) ? paramSort : 'name';

      //* Direccion y forma de ordenamiento */
      const sortDir = params?.order === 'desc' ? 'desc' : 'asc';

      //* Objeto de ordenamiento para Prisma */
      const orderBy = {
        [sortField]: sortDir,
      } as Prisma.productOrderByWithRelationInput;

      const [total, data] = await Promise.all([
        tx.product.count({ where }),
        tx.product.findMany({ where, orderBy, skip, take: limit }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          total_items: total,
          total_pages: totalPages,
          current_page: page,
          page_size: limit,
        },
      };
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
