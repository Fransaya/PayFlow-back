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

  async createBusinessHour(data: {
    tenant_id: string;
    day_of_week: number;
    open_time: string;
    close_time: string;
  }): Promise<BusinessHourResponse> {
    return this.dbService.runInTransaction(
      { tenantId: data.tenant_id },
      async (tx) => {
        const businessHourRepo = BusinessHourRepo(tx);
        return await businessHourRepo.createBusinessHour(data);
      },
    );
  }

  async updateBusinessHour(
    hour_id: string,
    tenant_id: string,
    data: {
      day_of_week?: number;
      open_time?: string;
      close_time?: string;
    },
  ): Promise<BusinessHourResponse> {
    return this.dbService.runInTransaction(
      { tenantId: tenant_id },
      async (tx) => {
        const businessHourRepo = BusinessHourRepo(tx);
        return await businessHourRepo.updateBusinessHour(
          hour_id,
          tenant_id,
          data,
        );
      },
    );
  }

  async deleteBusinessHour(
    hour_id: string,
    tenant_id: string,
  ): Promise<{ message: string }> {
    return this.dbService.runInTransaction(
      { tenantId: tenant_id },
      async (tx) => {
        const businessHourRepo = BusinessHourRepo(tx);
        return await businessHourRepo.deleteBusinessHour(hour_id, tenant_id);
      },
    );
  }
}
