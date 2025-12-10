import { Controller, Get, Query, Param } from '@nestjs/common';

import { BusinessHourService } from '../services/business-hour.service';
import { BusinessHourResponse } from '@src/types/business-hour';

@Controller('business/public/hours')
export class BusinessHourController {
  constructor(private readonly businessHourService: BusinessHourService) {}

  @Get(':tenant_id')
  async getBusinessHours(
    @Param('tenant_id') tenant_id: string,
  ): Promise<BusinessHourResponse[]> {
    return await this.businessHourService.getBusinessHoursByTenantId(tenant_id);
  }

  @Get('is-open/:tenant_id')
  async getBusinessIsOpen(
    @Param('tenant_id') tenant_id: string,
    @Query('day_of_week') day_of_week: number,
    @Query('time') time: string,
  ): Promise<boolean> {
    return await this.businessHourService.getBusinessIsOpen(
      tenant_id,
      day_of_week,
      time,
    );
  }
}
