import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { DbService, tenantRepo, businessRepo } from '@libs/db';
import { StorageService } from '@src/storage/storage.service';

// Tipos para tenant
import { TenantUpdate } from '@src/types/tenant';

// DTO
import { UpdateVisualConfigDto } from '../dto/UpdateVisualConfig.dto';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly storageService: StorageService,
  ) {}

  async getPublicTenantInfo(slug: string) {
    try {
      const response = await this.dbService.runInTransaction({}, async (tx) => {
        const repo = tenantRepo(tx);
        return repo.getPublicTenantInfoBySlug(slug);
      });

      return response;
    } catch (error) {
      this.logger.error(`Error getting public tenant info: ${error}`);
      throw new InternalServerErrorException(
        'Error getting public tenant info',
      );
    }
  }

  async getTenantInfo(tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = tenantRepo(tx);
          return repo.getTenantById(tenantId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error getting tenant info: ${error}`);
      throw new InternalServerErrorException('Error getting tenant info');
    }
  }

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
      const exists = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = tenantRepo(tx);
          return repo.tenantExistById(tenantId); // Asumiendo que tienes este método
        },
      );

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

  // Actualizar información del tenant
  async updateTenantInfo(body: TenantUpdate, tenantId: string): Promise<any> {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = tenantRepo(tx);
          return repo.updateTenantInfo(body, tenantId);
        },
      );

      return response;
    } catch (error: any) {
      this.logger.error(`Error updating tenant info: ${error}`);
      throw new InternalServerErrorException('Error updating tenant info');
    }
  }

  async getTenantStats(tenantId: string): Promise<any> {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = tenantRepo(tx);
          return repo.getTenantStats(tenantId);
        },
      );

      return response;
    } catch (error: any) {
      this.logger.error(`Error getting tenant stats: ${error}`);
      throw new InternalServerErrorException('Error getting tenant stats');
    }
  }

  async updateVisualConfig(tenantId: string, data: UpdateVisualConfigDto) {
    try {
      // 1. Separar campos: la URL del logo está en 'business' y los colores en 'tenant'.
      const { logo_url, primary_color, secondary_color } = data;

      const updatedTenant = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = tenantRepo(tx);
          return repo.updateTenantVisualConfig(tenantId, {
            primary_color,
            secondary_color,
          });
        },
      );

      const businessInfo = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = businessRepo(tx);
          return repo.getBusinessInfo(tenantId);
        },
      );

      if (!businessInfo) {
        throw new BadRequestException(
          `Business with ID "${tenantId}" does not exist`,
        );
      }

      let updatedBusiness: any;
      if (logo_url) {
        updatedBusiness = await this.dbService.runInTransaction(
          { tenantId },
          async (tx) => {
            const repo = businessRepo(tx);
            return repo.updateBusinessLogo(
              businessInfo.business_id,
              tenantId,
              logo_url,
            );
          },
        );
      }

      return {
        tenant: updatedTenant,
        business: updatedBusiness,
      };
    } catch (error: any) {
      this.logger.error(`Error updating visual config: ${error}`);
      throw new InternalServerErrorException('Error updating visual config');
    }
  }

  async getVisualConfig(tenantId: string) {
    try {
      const tenant = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = tenantRepo(tx);
          return repo.getTenantById(tenantId);
        },
      );

      const business = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = businessRepo(tx);
          return repo.getBusinessInfo(tenantId);
        },
      );

      if (business && business.logo_url) {
        business.logo_url = await this.storageService.getPresignedGetUrl(
          business.logo_url,
        );
      }

      return {
        tenant: {
          primary_color: tenant?.primary_color,
          secondary_color: tenant?.secondary_color,
        },
        business: {
          logo_url: business?.logo_url,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting visual config: ${error}`);
      throw new InternalServerErrorException('Error getting visual config');
    }
  }
}
