/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Injectable } from '@nestjs/common';

import { DbService, deliveryConfigRepo, configRepo } from '@src/libs/db';

import { Prisma } from '@prisma/client';

@Injectable()
export class ConfigServiceInternal {
  constructor(private readonly dbService: DbService) {}

  async getBusinessConfig(tenant_id: string) {
    const businessConfig = await this.dbService.runInTransaction(
      { tenantId: tenant_id },
      async (tx) => {
        const repo = configRepo(tx);
        return await repo.getBusinessConfig(tenant_id);
      },
    );

    const responseStructure = {
      tenant: businessConfig.tenant,
      business: businessConfig.business,
      delivery: {
        actives: businessConfig.deliveryConfig,
      },
      payment: {
        mp_configured: businessConfig.paymentConfig ? true : false,
        allow_cash_on_delivery: businessConfig.tenant?.allow_cash_on_delivery,
      },
    };

    return responseStructure;
  }

  // Metodos asociado a configuraciones de delivery o entrega.
  async getDeliveryConfigsByTenant(tenant_id: string) {
    return await this.dbService.runInTransaction(
      { tenantId: tenant_id },
      async (tx) => {
        const repo = deliveryConfigRepo(tx);
        return await repo.getDeliveryConfigsByTenant(tenant_id);
      },
    );
  }

  async getActiveDeliveryConfigs(tenant_id: string) {
    return await this.dbService.runInTransaction(
      { tenantId: tenant_id },
      async (tx) => {
        const repo = deliveryConfigRepo(tx);
        return await repo.getActiveDeliveryConfigs(tenant_id);
      },
    );
  }

  async getDeliveryConfigById(delivery_config_id: string) {
    return await this.dbService.runInTransaction({}, async (tx) => {
      const repo = deliveryConfigRepo(tx);
      return await repo.getDeliveryConfigById(delivery_config_id);
    });
  }

  async getDeliveryConfigByType(tenant_id: string, type: string) {
    return await this.dbService.runInTransaction(
      { tenantId: tenant_id },
      async (tx) => {
        const repo = deliveryConfigRepo(tx);
        return await repo.getDeliveryConfigByType(tenant_id, type);
      },
    );
  }

  async createDeliveryConfig(data: {
    tenant_id: string;
    is_active?: boolean;
    type: string;
    name?: string | null;
    description?: string | null;
    base_rate?: number;
    settings_json?: Prisma.InputJsonValue | null;
  }) {
    return await this.dbService.runInTransaction(
      { tenantId: data.tenant_id },
      async (tx) => {
        const repo = deliveryConfigRepo(tx);
        return await repo.createDeliveryConfig(data);
      },
    );
  }

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
    return await this.dbService.runInTransaction({}, async (tx) => {
      const repo = deliveryConfigRepo(tx);
      return await repo.updateDeliveryConfig(delivery_config_id, data);
    });
  }

  async toggleDeliveryConfig(delivery_config_id: string, is_active: boolean) {
    return await this.dbService.runInTransaction({}, async (tx) => {
      const repo = deliveryConfigRepo(tx);
      return await repo.updateDeliveryConfig(delivery_config_id, {
        is_active,
      });
    });
  }

  async deleteDeliveryConfig(delivery_config_id: string) {
    return await this.dbService.runInTransaction({}, async (tx) => {
      const repo = deliveryConfigRepo(tx);
      return await repo.deleteDeliveryConfig(delivery_config_id);
    });
  }

  // Crear o actualizar configuración de delivery (upsert)
  async upsertDeliveryConfig(data: {
    tenant_id: string;
    type: string;
    is_active?: boolean;
    name?: string | null;
    description?: string | null;
    base_rate?: number;
    settings_json?: Prisma.InputJsonValue | null;
  }) {
    return await this.dbService.runInTransaction(
      { tenantId: data.tenant_id },
      async (tx) => {
        const repo = deliveryConfigRepo(tx);
        return await repo.upsertDeliveryConfig(data);
      },
    );
  }

  async getPaymentConfig(tenantId: string) {
    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = configRepo(tx);
      return await repo.getPaymentConfigsByTenant(tenantId);
    });
  }

  async updateTenantCashOnDelivery(
    tenantId: string,
    allow_cash_on_delivery: boolean,
  ) {
    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = configRepo(tx);
      return await repo.updatePaymentConfigCashOnDelivery(
        tenantId,
        allow_cash_on_delivery,
      );
    });
  }
}
