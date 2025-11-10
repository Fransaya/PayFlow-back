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

import { GoogleTokenGuard } from '@src/guards/google-token.guard';

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
  @UseGuards(GoogleTokenGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getTenantInfo(@Query('tenantId') tenantId: string): Promise<any> {
    return await this.tenantService.getTenantInfo(tenantId);
  }

  @Patch('update-info')
  @UseGuards(GoogleTokenGuard)
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
