import { Controller, Get, Param } from '@nestjs/common';

import { BusinessService } from '../services/business.service';

@Controller('business/public')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get(':slug')
  async getBusinessInfo(@Param('slug') slug: string): Promise<any> {
    return this.businessService.getBusinessInfo(slug);
  }

  @Get('info/:tenantId')
  async getBusinessByTenantId(@Param('tenantId') tenantId: string): Promise<{
    tenant_id: string;
    business_id: string;
    legal_name: string;
    cuit: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    address: string | null;
    logo_url: string | null;
  } | null> {
    return this.businessService.getBusinessByTenantId(tenantId);
  }
}
