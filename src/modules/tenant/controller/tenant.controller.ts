import {
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
  UseFilters,
  Controller,
} from '@nestjs/common';

import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { Auth0TokenGuard } from '@src/guards/auth0-token.guard';

import { TenantService } from '../service/tenant.service';

import { ApiTags } from '@nestjs/swagger';

// DTOs
import { UpdateTenantDto } from '../dto/UpdateTenant.dto';

@ApiTags('Tenant')
@Controller('tenant')
@UseFilters(HttpExceptionFilter)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @UseGuards(Auth0TokenGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getTenantInfo(@Query('tenantId') tenantId: string): Promise<any> {
    return await this.tenantService.getTenantInfo(tenantId);
  }

  @Patch('update-info')
  @UseGuards(Auth0TokenGuard)
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
    @Query('tenantId') tenantId: string,
  ): Promise<any> {
    return await this.tenantService.updateTenantInfo(body, tenantId);
  }
}
