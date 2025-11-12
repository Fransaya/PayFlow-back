import {
  Get,
  Controller,
  Patch,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { BusinessService } from '../services/business.service';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';
// DTOs
import { CreateBusinessDto } from '../dto/CreateBusiness.dto';

@ApiTags('Business')
@Controller('business')
@UseFilters(HttpExceptionFilter)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @UseFilters(HttpExceptionFilter)
  async getBusiness(@CurrentUser() user: any): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.businessService.getBusiness(tenantId);
  }

  @Post('create')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseFilters(HttpExceptionFilter)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async createBusiness(
    @Body() body: CreateBusinessDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.businessService.createBusiness(tenantId, body);
  }

  @Patch('update')
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
  async updateBusiness(
    @Body() body: CreateBusinessDto,
    @CurrentUser() user: any,
    @Query('businessId') businessId: string,
  ): Promise<any> {
    const tenantId = user.tenant_id;
    return await this.businessService.updateBusiness(
      tenantId,
      businessId,
      body,
    );
  }
}
