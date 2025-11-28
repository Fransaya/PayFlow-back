import { Injectable } from '@nestjs/common';

import {
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
  UseFilters,
  Controller,
} from '@nestjs/common';
import { RoleService } from '../services/role.service';

import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

import { ApiTags } from '@nestjs/swagger';

import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';
import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';

@Controller('roles')
@ApiTags('Roles')
@Injectable()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: any,
  ) {
    return await this.roleService.createRoleForTenant(
      user.tenant_id,
      createRoleDto,
    );
  }

  @Get()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getAllRoles(@CurrentUser() user: any) {
    const tenantId = user.tenant_id;

    return await this.roleService.getAllRolesForTenant(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async getRoleById(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.roleService.getRoleByIdAndTenant(id, user.tenant_id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: any,
  ) {
    return await this.roleService.updateRoleForTenant(
      user.tenant_id,
      id,
      updateRoleDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseFilters(HttpExceptionFilter)
  async deleteRole(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.roleService.deleteRoleForTenant(user.tenant_id, id);
  }
}
