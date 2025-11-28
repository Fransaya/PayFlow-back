import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DbService, userOwnerRepo } from '@libs/db';

import { UpdateUserOwnerDto } from '../dto/useOwner.dto';
@Injectable()
export class UserOwnerService {
  private readonly logger = new Logger(UserOwnerService.name);

  constructor(private readonly dbService: DbService) {}

  async getUserOwnerInfo(userId: string, tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = userOwnerRepo(tx);
          return repo.getUserOwnerInfo(userId, tenantId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error getting tenant info: ${error}`);
      throw new InternalServerErrorException('Error getting tenant info');
    }
  }

  async updateUserOwner(body: UpdateUserOwnerDto, tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = userOwnerRepo(tx);
          return repo.updateUserOwner(body, tenantId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error getting tenant info: ${error}`);
      throw new InternalServerErrorException('Error getting tenant info');
    }
  }
}
