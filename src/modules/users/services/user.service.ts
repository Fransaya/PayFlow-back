import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DbService, userRepo } from '@libs/db';

// Tipos para getUserByEmail
import { GetUserByEmailResponse } from '@src/types/user';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly dbService: DbService) {}

  async validateUserNotExists(email: string): Promise<boolean> {
    try {
      const exists = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = userRepo(tx);
        return repo.userExistsByEmail(email); // Asumiendo que tienes este método
      });

      return exists;
    } catch (error: any) {
      if (error instanceof ConflictException) throw error;

      this.logger.error(`Error validating user existence: ${error}`);
      throw new InternalServerErrorException('Error validating user');
    }
  }

  async validateUserNotInTenant(
    email: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    try {
      const exists = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = userRepo(tx);
          return repo.userExistsInTenant(email, tenantId, userId); // Asumiendo que tienes este método
        },
      );

      if (exists) {
        throw new ConflictException(
          `User with email "${email}" already exists in this tenant`,
        );
      }
    } catch (error: any) {
      if (error instanceof ConflictException) throw error;

      this.logger.error(`Error validating user in tenant: ${error}`);
      throw new InternalServerErrorException('Error validating user in tenant');
    }
  }

  async getUserByEmail(email: string): Promise<GetUserByEmailResponse | null> {
    try {
      return this.dbService.runInTransaction({}, async (tx) => {
        const repo = userRepo(tx);
        return repo.getUserByEmail(email); // Asumiendo que tienes este método
      });
    } catch (error: any) {
      if (error instanceof ConflictException) throw error;

      this.logger.error(`Error validating user in tenant: ${error}`);
      throw new InternalServerErrorException('Error validating user in tenant');
    }
  }
}
