import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DbService, tenantRepo } from '@src/libs/db';

import { StorageService } from '@src/storage/storage.service';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name + ' - Public');

  constructor(
    private readonly dbService: DbService,
    private readonly storageService: StorageService,
  ) {}

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

      if (tenantInfo) {
        for (const business of tenantInfo.business) {
          business.logo_url = business.logo_url
            ? await this.storageService.getPresignedGetUrl(business.logo_url)
            : null;
        }
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
}
