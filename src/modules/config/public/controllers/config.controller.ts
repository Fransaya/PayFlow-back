import { Controller, Logger, Get, Param } from '@nestjs/common';

import { ConfigServiceInternal } from '../services/config.service';

@Controller('config/public')
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);

  constructor(private readonly configService: ConfigServiceInternal) {}

  @Get('tenant-info/:tenantId')
  async getPublicTenantInfoBySlug(@Param('tenantId') tenantId: string) {
    this.logger.log(`Fetching public tenant info for tenantId: ${tenantId}`);
    return await this.configService.getDeliveryConfigsActiveByTenant(tenantId);
  }
}
