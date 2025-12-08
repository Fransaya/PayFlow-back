import { Prisma } from '@prisma/client';

export function socialIntegrationRepo(tx: Prisma.TransactionClient) {
  return {
    // Obtener todas las configuraciones de integración social de un tenant
    async getSocialIntegrationsByTenant(tenant_id: string) {
      return await tx.social_integration.findMany({
        where: {
          tenant_id,
        },
      });
    },

    // Obtener configuración de integracion social de tenant por tenant_id y tipo
    async getSocialIntegrationByChannel(tenant_id: string, channel: string) {
      return await tx.social_integration.findFirst({
        where: {
          tenant_id,
          channel,
        },
      });
    },

    // Crear o actualizar configuración de integración social
    async upsertConfigSocialIntegration(data: {
      tenant_id: string;
      channel: string;
      access_token_enc: string;
      refresh_token_enc?: string | null;
      external_id?: string | null;
      status: string;
      raw_json: Prisma.InputJsonValue;
    }) {
      return await tx.social_integration.upsert({
        where: {
          tenant_id_channel: {
            tenant_id: data.tenant_id,
            channel: data.channel,
          },
        },
        update: {
          access_token_enc: data.access_token_enc,
          refresh_token_enc: data.refresh_token_enc || null,
          external_id: data.external_id || null,
          status: data.status,
          raw_json: data.raw_json,
          updated_at: new Date(),
        },
        create: {
          tenant_id: data.tenant_id,
          channel: data.channel,
          access_token_enc: data.access_token_enc,
          refresh_token_enc: data.refresh_token_enc || null,
          external_id: data.external_id || null,
          status: data.status,
          raw_json: data.raw_json,
        },
      });
    }, // Eliminar configuración de integración social

    async deleteSocialIntegration(tenant_id: string, channel: string) {
      return await tx.social_integration.deleteMany({
        where: {
          tenant_id,
          channel,
        },
      });
    },
  };
}
