import { Controller, Get, Param } from '@nestjs/common';

import { BusinessService } from '../services/business.service';

@Controller('business/public')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get(':slug')
  async getBusinessInfo(@Param('slug') slug: string): Promise<any> {
    return this.businessService.getBusinessInfo(slug);
  }
}
