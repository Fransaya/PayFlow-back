import { Prisma } from '@prisma/client';

export function configRepo(tx: Prisma.TransactionClient) {
  return {
    // Obtener Estado de Configuracion base para un negocio / business
    async getBusinessConfig(tenant_id: string) {
      const tenant = await tx.tenant.findUnique({
        where: { tenant_id },
        select: {
          primary_color: true,
          secondary_color: true,
          allow_cash_on_delivery: true,
          plan_status: true,
        },
      });

      const business = await tx.business.findFirst({
        where: { tenant_id },
      });

      const deliveryConfig = await tx.delivery_config.findMany({
        where: {
          tenant_id,
          is_active: true,
        },
      });

      const paymentConfig = await tx.mp_config.findFirst({
        where: {
          tenant_id,
        },
      });

      const hoursConfig = await tx.business_hours.findFirst({
        where: {
          tenant_id,
        },
      });

      return {
        tenant,
        business,
        deliveryConfig,
        paymentConfig,
        hoursConfig,
      };
    },

    // Obtener todas las configuraciones de entrega de un tenant
    async getPaymentConfigsByTenant(tenant_id: string) {
      const responseCashConfig = await tx.tenant.findUnique({
        where: { tenant_id },
        select: {
          allow_cash_on_delivery: true,
        },
      });

      const responseMPConfig = await tx.mp_config.findFirst({
        where: { tenant_id },
        select: {
          mp_config_id: true,
        },
      });

      return {
        cash_on_delivery: responseCashConfig?.allow_cash_on_delivery || false,
        has_mp_config: responseMPConfig ? true : false,
      };
    },

    async updatePaymentConfigCashOnDelivery(
      tenant_id: string,
      allow_cash_on_delivery: boolean,
    ) {
      return await tx.tenant.update({
        where: { tenant_id },
        data: {
          allow_cash_on_delivery,
        },
        select: {
          tenant_id: true,
          allow_cash_on_delivery: true,
        },
      });
    },
  };
}
