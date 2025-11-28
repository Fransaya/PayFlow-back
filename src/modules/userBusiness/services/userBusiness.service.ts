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

  async getUserBusinessBasicInfo(userId: string) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = userBusinessRepo(tx);
        return repo.getUserBusinessBasicInfo(userId);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error getting user business basic info: ${error}`);
      throw new InternalServerErrorException(
        'Error getting user business basic info',
      );
    }
  }

  async getUsersForBusiness(tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = userBusinessRepo(tx);
          return repo.getUsersForBusiness(tenantId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error getting tenant info: ${error}`);
      throw new InternalServerErrorException('Error getting tenant info');
    }
  }

  async getSpecificUserBusiness(tenantId: string, userId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = userBusinessRepo(tx);
          return repo.getSpecificUserBusiness(tenantId, userId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error getting specific user business: ${error}`);
      throw new InternalServerErrorException(
        'Error getting specific user business',
      );
    }
  }

  async createUserBusiness(body: CreateUserBusinessDto, tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = userBusinessRepo(tx);
          return repo.createUserBusiness(body, tenantId);
        },
      );

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
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = userBusinessRepo(tx);
          return repo.updateUserBusiness(body, tenantId, userId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error updating user business: ${error}`);
      throw new InternalServerErrorException('Error updating user business');
    }
  }

  // FUNCIONALIDADES ASOCIADAS A ROLES DE USUARIOS
  async assingRole(userId: string, roleId: string, tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = userBusinessRepo(tx);
          return repo.assignRoleToUserBusiness(userId, roleId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error assigning role to user: ${error}`);
      throw new InternalServerErrorException('Error assigning role to user');
    }
  }

  async removeRole(userId: string, roleId: string, tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = userBusinessRepo(tx);
          return repo.removeRoleFromUserBusiness(userId, roleId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error removing role from user: ${error}`);
      throw new InternalServerErrorException('Error removing role from user');
    }
  }

  async getUserRoles(userId: string, tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          return tx.user_role.findMany({
            where: {
              user_id: userId,
            },
            select: {
              role: true,
            },
          });
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error getting user roles: ${error}`);
      throw new InternalServerErrorException('Error getting user roles');
    }
  }
}
