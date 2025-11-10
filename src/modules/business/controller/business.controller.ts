import {
  Get,
  Controller,
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

import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { GoogleTokenGuard } from '@src/guards/google-token.guard';

// DTOs
import { CreateBusinessDto } from '../dto/CreateBusiness.dto';

@ApiTags('Business')
@Controller('business')
@UseFilters(HttpExceptionFilter)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(GoogleTokenGuard)
  @UseFilters(HttpExceptionFilter)
  async getBusiness(
    @Query('tenantId') tenantId: string,
    @Query('businessId') businessId: string,
  ): Promise<any> {
    return await this.businessService.getBusiness(tenantId, businessId);
  }

  @Post('create')
  @UseGuards(GoogleTokenGuard)
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
    @Query('tenantId') tenantId: string,
  ): Promise<any> {
    return await this.businessService.createBusiness(tenantId, body);
  }

  @Post('update')
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
  async updateBusiness(
    @Body() body: CreateBusinessDto,
    @Query('tenantId') tenantId: string,
    @Query('businessId') businessId: string,
  ): Promise<any> {
    return await this.businessService.updateBusiness(
      tenantId,
      businessId,
      body,
    );
  }
}
