import {
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  UseFilters,
  Controller,
  Post,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';

import { ApiTags } from '@nestjs/swagger';

import { UserBusinessService } from '../services/userBusiness.service';

import { UserFromJWT } from '@src/types/userFromJWT';

import {
  CreateUserBusinessDto,
  UpdateUserBusinessDto,
} from '../dto/userBusiness.dto';

@ApiTags('UserBusiness')
@Controller('userBusiness')
@UseFilters(HttpExceptionFilter)
export class UserBusinessController {
  constructor(private readonly userBusinessService: UserBusinessService) {}

  @Get()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getUserBusinessInfo(@CurrentUser() user: UserFromJWT): Promise<any> {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const userBusinessInfo =
      await this.userBusinessService.getUsersForBusiness(tenantId);

    return userBusinessInfo;
  }

  @Post()
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
  async createUserBusiness(
    @Body() body: CreateUserBusinessDto,
    @CurrentUser() user: UserFromJWT,
  ): Promise<any> {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const createdUserBusiness =
      await this.userBusinessService.createUserBusiness(body, tenantId);

    return createdUserBusiness;
  }

  @Put(':userId')
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
  async updateUserBusiness(
    @Body() body: UpdateUserBusinessDto,
    @CurrentUser() user: UserFromJWT,
    @Param('userId') userId: string,
  ): Promise<any> {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    const updatedUserBusiness =
      await this.userBusinessService.updateUserBusiness(body, tenantId, userId);

    return updatedUserBusiness;
  }
}
