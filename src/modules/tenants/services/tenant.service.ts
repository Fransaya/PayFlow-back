/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import {
  DbService,
  tenantRepo,
  businessRepo,
  socialIntegrationRepo,
} from '@libs/db';

import { Prisma } from '@prisma/client';

// Tipos para tenant
import { TenantUpdate } from '@src/types/tenant';

// DTO
import { UpdateVisualConfigDto } from '../dto/UpdateVisualConfig.dto';

// Utilidades
// Funcion para encriptar tokens
import { encryptToken } from '@src/encryption/services/encryption.service';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly dbService: DbService) {}

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

      console.log('Updating visual config with data:', data);

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

  //* METODOS DE CONFIGURACION DE INTEGRACIONES SOCIALES *//

  // Obtener todas las integraciones asociadas a un tenant
  async getSocialIntegrations(tenantId: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = socialIntegrationRepo(tx);
          return await repo.getSocialIntegrationsByTenant(tenantId);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error getting social integrations: ${error}`);
      throw new InternalServerErrorException(
        'Error getting social integrations',
      );
    }
  }

  // Obtener configuración de integración social por canal
  async getSocialIntegrationByChannel(tenantId: string, channel: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = socialIntegrationRepo(tx);
          return await repo.getSocialIntegrationByChannel(tenantId, channel);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error getting social integration by channel: ${error}`,
      );
      throw new InternalServerErrorException(
        'Error getting social integration by channel',
      );
    }
  }

  // Crear o actualizar configuración de integración social
  async upsertSocialIntegrationConfig(data: {
    tenant_id: string;
    channel: string;
    access_token: string;
    refresh_token?: string | null;
    external_id?: string | null;
    status: string;
    raw_json: Prisma.InputJsonValue;
  }) {
    const { access_token, refresh_token, ...rest } = data;
    // Encriptar tokens antes de guardarlos
    const access_token_enc = encryptToken(access_token);
    let refresh_token_enc: string | null = null;
    if (refresh_token) {
      refresh_token_enc = encryptToken(refresh_token);
    }

    const dataToSave = {
      ...rest,
      access_token_enc,
      refresh_token_enc,
    };

    try {
      const response = await this.dbService.runInTransaction(
        { tenantId: data.tenant_id },
        async (tx) => {
          const repo = socialIntegrationRepo(tx);
          return await repo.upsertConfigSocialIntegration(dataToSave);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error upserting social integration config: ${error}`);
      throw new InternalServerErrorException(
        'Error upserting social integration config',
      );
    }
  }

  // Eliminar configuración de integración social
  async deleteSocialIntegration(tenantId: string, channel: string) {
    try {
      const response = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const repo = socialIntegrationRepo(tx);
          return await repo.deleteSocialIntegration(tenantId, channel);
        },
      );

      return response;
    } catch (error) {
      this.logger.error(`Error deleting social integration: ${error}`);
      throw new InternalServerErrorException(
        'Error deleting social integration',
      );
    }
  }
}
