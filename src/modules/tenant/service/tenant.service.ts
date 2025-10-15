import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { DbService, tenantRepo } from '@libs/db';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly dbService: DbService) {}

  async validateTenantDoesNotExist(slug: string): Promise<void> {
    try {
      const exists = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = tenantRepo(tx);
        return repo.tenantExist(slug);
      });

      if (exists) {
        throw new ConflictException(
          `Tenant with slug "${slug}" already exists`,
        );
      }
    } catch (error: any) {
      if (error instanceof ConflictException) throw error;

      this.logger.error(`Error validating tenant existence: ${error}`);
      throw new InternalServerErrorException('Error validating tenant');
    }
  }

  async validateTenantExists(tenantId: string): Promise<void> {
    try {
      const exists = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = tenantRepo(tx);
        return repo.tenantExistById(tenantId); // Asumiendo que tienes este método
      });

      if (!exists) {
        throw new BadRequestException(
          `Tenant with ID "${tenantId}" does not exist`,
        );
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error(`Error validating tenant existence: ${error}`);
      throw new InternalServerErrorException('Error validating tenant');
    }
  }
}
