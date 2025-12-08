/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Post,
  Query,
  Param,
  UseGuards,
  UseFilters,
  Controller,
  HttpException,
  Delete,
} from '@nestjs/common';
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';

import { TenantService } from '../services/tenant.service';
import { StorageService } from '@src/storage/storage.service';

import { ApiTags } from '@nestjs/swagger';

import { UserFromJWT } from '@src/types/userFromJWT';

// DTOs
import { UpdateTenantDto } from '../dto/UpdateTenant.dto';
import { UpdateVisualConfigDto } from '../dto/UpdateVisualConfig.dto';

@ApiTags('Tenant')
@Controller('tenant')
@UseFilters(HttpExceptionFilter)
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly storageService: StorageService,
  ) {}

  @Get('info')
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getPublicTenantInfo(@Query('slug') slug: string): Promise<any> {
    return await this.tenantService.getPublicTenantInfo(slug);
  }

  @Get()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getTenantInfo(@CurrentUser() user: UserFromJWT): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.tenantService.getTenantInfo(tenantId);
  }

  @Patch('update-info')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateTenantInfo(
    @Body() body: UpdateTenantDto,
    @CurrentUser() user: UserFromJWT,
  ): Promise<any> {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return await this.tenantService.updateTenantInfo(body, tenantId);
  }

  @Get('stats')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getTenantStats(@CurrentUser() user: UserFromJWT): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.tenantService.getTenantStats(tenantId);
  }

  @Patch('update-visual-config')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateTenantVisualConfig(
    @Body() body: UpdateVisualConfigDto,
    @CurrentUser() user: UserFromJWT,
  ): Promise<any> {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return await this.tenantService.updateVisualConfig(tenantId, body);
  }

  @Get('logo-upload-url')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getLogoUploadUrl(
    @CurrentUser() user: UserFromJWT,
    @Query('type') type: string,
  ): Promise<any> {
    try {
      const tenantId: string = user.tenant_id;
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const { url, key } = await this.storageService.getPresignedUrl(
        tenantId,
        type,
        'tenants',
      );
      return {
        uploadUrl: url,
        imageKey: key,
        expiresIn: 300,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('visual-config')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getVisualConfig(@CurrentUser() user: UserFromJWT): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.tenantService.getVisualConfig(tenantId);
  }

  @Get('social-integrations')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getSocialIntegrations(@CurrentUser() user: UserFromJWT): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.tenantService.getSocialIntegrations(tenantId);
  }

  @Get('social-integration/:channel')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getSocialIntegrationByChannel(
    @CurrentUser() user: UserFromJWT,
    @Param('channel') channel: string,
  ): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.tenantService.getSocialIntegrationByChannel(
      tenantId,
      channel,
    );
  }

  @Post('social-integration')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async upsertSocialIntegration(
    @CurrentUser() user: UserFromJWT,
    @Body() body: any,
  ): Promise<any> {
    const tenantId = user.tenant_id;
    const dataToSave = {
      tenant_id: tenantId,
      ...body,
    };
    return await this.tenantService.upsertSocialIntegrationConfig(dataToSave);
  }

  @Delete('social-integration/:channel')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async deleteSocialIntegration(
    @CurrentUser() user: UserFromJWT,
    @Param('channel') channel: string,
  ): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.tenantService.deleteSocialIntegration(tenantId, channel);
  }
}
