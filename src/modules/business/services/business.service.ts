import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { Business } from '@src/types/business';

import { DbService, businessRepo } from '@src/libs/db';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(private readonly dbService: DbService) {}

  async getBusiness(tenant_id: string) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = businessRepo(tx);
        return repo.getBusinessById(tenant_id);
      });

      return response;
    } catch (error) {
      this.logger.error('Error getting business', error);
      throw new InternalServerErrorException('Error getting business');
    }
  }

  async createBusiness(tenant_id: string, business: Business) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = businessRepo(tx);
        return repo.createBusiness({
          tenant_id,
          legal_name: business.legal_name,
          cuit: business.cuit,
          contact_name: business.contact_name,
          contact_phone: business.contact_phone,
          address: business.address,
        });
      });

      return response;
    } catch (error) {
      this.logger.error('Error creating business', error);
      throw new InternalServerErrorException('Error creating business');
    }
  }

  async updateBusiness(
    tenant_id: string,
    business_id: string,
    business: Business,
  ) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = businessRepo(tx);
        return repo.updateBusiness(tenant_id, business_id, {
          legal_name: business.legal_name,
          cuit: business.cuit,
          contact_name: business.contact_name,
          contact_phone: business.contact_phone,
          address: business.address,
        });
      });

      return response;
    } catch (error) {
      this.logger.error('Error updating business', error);
      throw new InternalServerErrorException('Error updating business');
    }
  }
}
