import { Injectable } from '@nestjs/common';

import { DbService, deliveryConfigRepo, configRepo } from '@src/libs/db';

@Injectable()
export class ConfigServiceInternal {
  constructor(private readonly dbService: DbService) {}

  async getConfigActiveByTenantId(tenant_id: string) {
    const deliveryConfig = await this.dbService.runInTransaction(
      { tenantId: tenant_id },
      async (tx) => {
        const deliveryConfig = deliveryConfigRepo(tx);
        return await deliveryConfig.getActiveDeliveryConfigs(tenant_id);
      },
    );

    const paymentConfig = await this.dbService.runInTransaction(
      { tenantId: tenant_id },
      async (tx) => {
        const config = configRepo(tx);
        return await config.getPaymentConfigsByTenant(tenant_id);
      },
    );

    return {
      deliveryConfigs: deliveryConfig,
      paymentConfig: paymentConfig,
    };
  }
}
