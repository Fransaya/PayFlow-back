/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Prisma } from '@prisma/client';

export function deliveryConfigRepo(tx: Prisma.TransactionClient) {
  return {
    // Obtener todas las configuraciones de entrega de un tenant
    async getDeliveryConfigsByTenant(tenant_id: string) {
      return await tx.delivery_config.findMany({
        where: {
          tenant_id,
        },
        orderBy: {
          type: 'asc',
        },
      });
    },

    // Obtener configuraciones activas de entrega de un tenant
    async getActiveDeliveryConfigs(tenant_id: string) {
      return await tx.delivery_config.findMany({
        where: {
          tenant_id,
          is_active: true,
        },
        orderBy: {
          type: 'asc',
        },
      });
    },

    // Obtener configuración de entrega por ID
    async getDeliveryConfigById(delivery_config_id: string) {
      return await tx.delivery_config.findUnique({
        where: {
          delivery_config_id,
        },
      });
    },

    // Obtener configuración de entrega por tenant y tipo
    async getDeliveryConfigByType(tenant_id: string, type: string) {
      return await tx.delivery_config.findUnique({
        where: {
          tenant_id_type: {
            tenant_id,
            type,
          },
        },
      });
    },

    // Crear configuración de entrega
    async createDeliveryConfig(data: {
      tenant_id: string;
      is_active?: boolean;
      type: string;
      name?: string | null;
      description?: string | null;
      base_rate?: number;
      settings_json?: Prisma.InputJsonValue | null;
    }) {
      return await tx.delivery_config.create({
        data: {
          tenant_id: data.tenant_id,
          is_active: data.is_active ?? true,
          type: data.type,
          name: data.name || null,
          description: data.description || null,
          base_rate: data.base_rate ?? 0,
          settings_json: data.settings_json || undefined,
        },
      });
    },

    // Actualizar configuración de entrega
    async updateDeliveryConfig(
      delivery_config_id: string,
      data: {
        is_active?: boolean;
        name?: string | null;
        description?: string | null;
        base_rate?: number;
        settings_json?: Prisma.InputJsonValue | null;
      },
    ) {
      return await tx.delivery_config.update({
        where: {
          delivery_config_id,
        },
        data: {
          ...(data.is_active !== undefined && { is_active: data.is_active }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.base_rate !== undefined && { base_rate: data.base_rate }),
          ...(data.settings_json !== undefined && {
            settings_json:
              data.settings_json === null
                ? Prisma.JsonNull
                : data.settings_json,
          }),
        },
      });
    },

    // Activar/Desactivar configuración de entrega
    async toggleDeliveryConfig(delivery_config_id: string, is_active: boolean) {
      return await tx.delivery_config.update({
        where: {
          delivery_config_id,
        },
        data: {
          is_active,
        },
      });
    },

    // Eliminar configuración de entrega
    async deleteDeliveryConfig(delivery_config_id: string) {
      return await tx.delivery_config.delete({
        where: {
          delivery_config_id,
        },
      });
    },

    // Upsert: Crear o actualizar configuración por tenant y tipo
    async upsertDeliveryConfig(data: {
      tenant_id: string;
      type: string;
      is_active?: boolean;
      name?: string | null;
      description?: string | null;
      base_rate?: number;
      settings_json?: Prisma.InputJsonValue | null;
    }) {
      return await tx.delivery_config.upsert({
        where: {
          tenant_id_type: {
            tenant_id: data.tenant_id,
            type: data.type,
          },
        },
        create: {
          tenant_id: data.tenant_id,
          type: data.type,
          is_active: data.is_active ?? true,
          name: data.name || null,
          description: data.description || null,
          base_rate: data.base_rate ?? 0,
          settings_json: data.settings_json || undefined,
        },
        update: {
          ...(data.is_active !== undefined && { is_active: data.is_active }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.base_rate !== undefined && { base_rate: data.base_rate }),
          ...(data.settings_json !== undefined && {
            settings_json:
              data.settings_json === null
                ? Prisma.JsonNull
                : data.settings_json,
          }),
        },
      });
    },
  };
}
