import { Injectable } from '@nestjs/common';
import { DbService, BusinessHourRepo } from '@src/libs/db';

import { BusinessHourResponse } from '@src/types/business-hour';

@Injectable()
export class BusinessHourService {
  constructor(private readonly dbService: DbService) {}

  async getBusinessHoursByTenantId(
    tenant_id: string,
  ): Promise<BusinessHourResponse[]> {
    return this.dbService.runInTransaction(
      { tenantId: tenant_id },
      async (tx) => {
        const businessHourRepo = BusinessHourRepo(tx);
        return await businessHourRepo.getBusinessHoursByTenantId(tenant_id);
      },
    );
  }

  async getBusinessIsOpen(
    tenant_id: string,
    day_of_week: number,
    time: string,
  ): Promise<boolean> {
    return this.dbService.runInTransaction(
      { tenantId: tenant_id },
      async (tx) => {
        const businessHourRepo = BusinessHourRepo(tx);
        return await businessHourRepo.getBusinessIsOpen(
          tenant_id,
          day_of_week,
          time,
        );
      },
    );
  }
}
