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
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';

import { TenantService } from '../service/tenant.service';

import { ApiTags } from '@nestjs/swagger';

// DTOs
import { UpdateTenantDto } from '../dto/UpdateTenant.dto';

@ApiTags('Tenant')
@Controller('tenant')
@UseFilters(HttpExceptionFilter)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

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
  async getTenantInfo(@CurrentUser() user: any): Promise<any> {
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
    @CurrentUser() user: any,
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
  async getTenantStats(@CurrentUser() user: any): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.tenantService.getTenantStats(tenantId);
  }
}
