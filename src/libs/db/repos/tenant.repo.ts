import { Prisma } from '@prisma/client';

// Interfaces de tenant
import { TenantUpdate } from '@src/types/tenant';

export function tenantRepo(tx: Prisma.TransactionClient) {
  return {
    async tenantExist(slug: string): Promise<boolean> {
      if (!slug?.trim()) throw new Error('Slug is required');

      const tenant = await tx.tenant.findUnique({
        where: { slug: slug.trim().toLowerCase() },
        select: { tenant_id: true },
      });

      return !!tenant;
    },

    async tenantExistById(tenant_id: string) {
      if (!tenant_id?.trim()) throw new Error('Tenant ID is required');

      const tenant = await tx.tenant.findUnique({
        where: { tenant_id: tenant_id.trim() },
        select: { tenant_id: true },
      });

      return !!tenant;
    },

    async getPublicTenantInfoBySlug(slug: string) {
      if (!slug?.trim()) throw new Error('Slug is required');

      return await tx.tenant.findUnique({
        where: { slug: slug.trim().toLowerCase() },
        select: {
          tenant_id: true,
          name: true,
          slug: true,
          primary_color: true,
          secondary_color: true,
          custom_domain: true,
          created_at: true,
          business: {
            select: {
              logo_url: true,
            },
            take: 1, // Solo el primero si hay múltiples
          },
        },
      });
    },

    async getTenantById(tenantId: string) {
      if (!tenantId?.trim()) throw new Error('Tenant ID is required');

      return await tx.tenant.findUnique({
        where: { tenant_id: tenantId.trim() },
        select: {
          tenant_id: true,
          name: true,
          slug: true,
          primary_color: true,
          secondary_color: true,
          custom_domain: true,
          plan_status: true,
          created_at: true,
        },
      });
    },

    async getTenantBySlug(slug: string) {
      if (!slug?.trim()) throw new Error('Slug is required');

      return await tx.tenant.findUnique({
        where: { slug: slug.trim().toLowerCase() },
        select: {
          tenant_id: true,
          name: true,
          slug: true,
          primary_color: true,
          secondary_color: true,
          custom_domain: true,
          plan_status: true,
          created_at: true,
        },
      });
    },

    // Método para obtener estadísticas del tenant
    async getTenantStats(tenantId: string) {
      if (!tenantId?.trim()) throw new Error('Tenant ID is required');

      const [ownersCount, businessUsersCount, productsCount, ordersCount] =
        await Promise.all([
          tx.user_owner.count({
            where: { tenant_id: tenantId.trim() },
          }),
          tx.user_business.count({
            where: { tenant_id: tenantId.trim() },
          }),
          tx.product.count({
            where: { tenant_id: tenantId.trim() },
          }),
          tx.order.count({
            where: { tenant_id: tenantId.trim() },
          }),
        ]);

      return {
        total_owners: ownersCount,
        total_business_users: businessUsersCount,
        total_users: ownersCount + businessUsersCount,
        total_products: productsCount,
        total_orders: ordersCount,
      };
    },

    async updateTenantInfo(body: TenantUpdate, tenantId: string) {
      const updateData: TenantUpdate = {};

      if (body.name) updateData.name = body.name.trim();
      if (body.primary_color)
        updateData.primary_color = body.primary_color.trim();
      if (body.secondary_color)
        updateData.secondary_color = body.secondary_color.trim();
      if (body.custom_domain)
        updateData.custom_domain = body.custom_domain.trim();

      return await tx.tenant.update({
        where: { tenant_id: tenantId },
        data: updateData,
        select: {
          tenant_id: true,
          name: true,
          slug: true,
          primary_color: true,
          secondary_color: true,
          custom_domain: true,
          plan_status: true,
          created_at: true,
        },
      });
    },
  };
}
