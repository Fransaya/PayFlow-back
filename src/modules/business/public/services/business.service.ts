import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DbService, tenantRepo, businessRepo } from '@src/libs/db';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name + ' - Public');

  constructor(private readonly dbService: DbService) {}

  async getBusinessInfo(slug: string) {
    try {
      const tenantInfo = await this.dbService.runInTransaction(
        {},
        async (tx) => {
          const tenantRepository = tenantRepo(tx);
          return tenantRepository.getPublicTenantInfoBySlug(slug);
        },
      );

      if (!tenantInfo) {
        throw new Error('Tenant not found');
      }

      return {
        tenant: tenantInfo,
      };
    } catch (error) {
      this.logger.error('Error getting public business info', error);
      throw new InternalServerErrorException(
        'Error getting public business info',
      );
    }
  }

  async getBusinessByTenantId(tenantId: string): Promise<{
    tenant_id: string;
    business_id: string;
    legal_name: string;
    cuit: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    address: string | null;
    logo_url: string | null;
  } | null> {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const businessRepository = businessRepo(tx);
          return businessRepository.getBusinessInfo(tenantId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error('Error getting public business info', error);
      throw new InternalServerErrorException(
        'Error getting public business info',
      );
    }
  }
}
