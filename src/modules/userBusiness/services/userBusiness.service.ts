import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DbService, userBusinessRepo } from '@libs/db';

import {
  UpdateUserBusinessDto,
  CreateUserBusinessDto,
} from '../dto/userBusiness.dto';

@Injectable()
export class UserBusinessService {
  private readonly logger = new Logger(UserBusinessService.name);

  constructor(private readonly dbService: DbService) {}

  async getUsersForBusiness(tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = userBusinessRepo(tx);
        return repo.getUsersForBusiness(tenantId);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error getting tenant info: ${error}`);
      throw new InternalServerErrorException('Error getting tenant info');
    }
  }

  async createUserBusiness(body: CreateUserBusinessDto, tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = userBusinessRepo(tx);
        return repo.createUserBusiness(body, tenantId);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error creating user business: ${error}`);
      throw new InternalServerErrorException('Error creating user business');
    }
  }

  async updateUserBusiness(
    body: UpdateUserBusinessDto,
    tenantId: string,
    userId: string,
  ) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = userBusinessRepo(tx);
        return repo.updateUserBusiness(body, tenantId, userId);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error updating user business: ${error}`);
      throw new InternalServerErrorException('Error updating user business');
    }
  }
}
