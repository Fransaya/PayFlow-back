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
} from '@nestjs/common';
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';

import { ApiTags } from '@nestjs/swagger';

import { UserOwnerService } from '../services/userOwner.service';

import { UpdateUserOwnerDto } from '../dto/useOwner.dto';

@ApiTags('UserOwner')
@Controller('userOwner')
@UseFilters(HttpExceptionFilter)
export class UserOwnerController {
  constructor(private readonly userOwnerService: UserOwnerService) {}

  @Get()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getUserOwnerInfo(@CurrentUser() user: any): Promise<any> {
    return await this.userOwnerService.getUserOwnerInfo(
      user.user_id,
      user.tenant_id,
    );
  }

  @Put('update')
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
  async updateUserOwner(
    @Body() body: UpdateUserOwnerDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return await this.userOwnerService.updateUserOwner(body, tenantId);
  }
}
