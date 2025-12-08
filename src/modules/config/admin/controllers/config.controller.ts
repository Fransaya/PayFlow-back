/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Controller,
  Logger,
  UseGuards,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
} from '@nestjs/common';

import { ConfigServiceInternal } from '../services/config.service';

import { UserFromJWT } from '@src/types/userFromJWT';

import { JwtGuard } from '@src/guards/jwt.guard';

import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

@Controller('config')
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);

  constructor(private readonly configService: ConfigServiceInternal) {}

  @Get('business/required')
  @UseGuards(JwtGuard)
  async getBusinessConfig(@CurrentUser() user: UserFromJWT) {
    return await this.configService.getBusinessConfig(user.tenant_id);
  }

  @Get('delivery-configs')
  @UseGuards(JwtGuard)
  async getDeliveryConfigsByTenant(@CurrentUser() user: UserFromJWT) {
    this.logger.log(
      `Getting delivery configs for tenant ${user.tenant_id} by user ${user.user_id}`,
    );
    return await this.configService.getDeliveryConfigsByTenant(user.tenant_id);
  }

  @Get('delivery-configs/active')
  @UseGuards(JwtGuard)
  async getActiveDeliveryConfigs(@CurrentUser() user: UserFromJWT) {
    this.logger.log(
      `Getting active delivery configs for tenant ${user.tenant_id} by user ${user.user_id}`,
    );
    return await this.configService.getActiveDeliveryConfigs(user.tenant_id);
  }

  @Get('delivery-configs/type/:type')
  @UseGuards(JwtGuard)
  async getDeliveryConfigByType(
    @Param('type') type: string,
    @CurrentUser() user: UserFromJWT,
  ) {
    this.logger.log(
      `Getting delivery config of type ${type} for tenant ${user.tenant_id} by user ${user.user_id}`,
    );
    return await this.configService.getDeliveryConfigByType(
      user.tenant_id,
      type,
    );
  }

  @Put('delivery-configs/upsert')
  @UseGuards(JwtGuard)
  async upsertDeliveryConfig(
    @CurrentUser() user: UserFromJWT,
    @Body() body: any,
  ) {
    this.logger.log(
      `Upserting delivery config for tenant ${user.tenant_id} by user ${user.user_id}`,
    );

    const object = {
      tenant_id: user.tenant_id,
      ...body,
    };

    return await this.configService.upsertDeliveryConfig(object);
  }

  // ⚠️ IMPORTANTE: Las rutas con :id deben ir DESPUÉS de las rutas específicas
  @Get('delivery-configs/:id')
  @UseGuards(JwtGuard)
  async getDeliveryConfigById(
    @Param('id') id: string,
    @CurrentUser() user: UserFromJWT,
  ) {
    this.logger.log(
      `Getting delivery config ${id} for tenant ${user.tenant_id} by user ${user.user_id}`,
    );
    return await this.configService.getDeliveryConfigById(id);
  }

  @Post('delivery-configs')
  @UseGuards(JwtGuard)
  async createDeliveryConfig(
    @CurrentUser() user: UserFromJWT,
    @Body() body: any,
  ) {
    this.logger.log(
      `Creating delivery config for tenant ${user.tenant_id} by user ${user.user_id}`,
    );

    const data: any = {
      tenant_id: user.tenant_id,
      ...body,
    };

    return await this.configService.createDeliveryConfig(data);
  }

  @Put('delivery-configs/:id')
  @UseGuards(JwtGuard)
  async updateDeliveryConfig(
    @Param('id') id: string,
    @CurrentUser() user: UserFromJWT,
    @Body() body: any,
  ) {
    this.logger.log(
      `Updating delivery config ${id} for tenant ${user.tenant_id} by user ${user.user_id}`,
    );
    return await this.configService.updateDeliveryConfig(id, body);
  }

  @Put('status/:id')
  @UseGuards(JwtGuard)
  async updateDeliveryConfigStatus(
    @Param('id') id: string,
    @CurrentUser() user: UserFromJWT,
    @Body() body: { is_active: boolean },
  ) {
    this.logger.log(
      `Updating status of delivery config ${id} for tenant ${user.tenant_id} by user ${user.user_id}`,
    );
    return await this.configService.toggleDeliveryConfig(id, body.is_active);
  }

  @Delete('delivery-configs/:id')
  @UseGuards(JwtGuard)
  async deleteDeliveryConfig(
    @Param('id') id: string,
    @CurrentUser() user: UserFromJWT,
  ) {
    this.logger.log(
      `Deleting delivery config ${id} for tenant ${user.tenant_id} by user ${user.user_id}`,
    );
    return await this.configService.deleteDeliveryConfig(id);
  }

  @Get('payment-config')
  @UseGuards(JwtGuard)
  async getPaymentConfig(@CurrentUser() user: UserFromJWT) {
    this.logger.log(
      `Getting payment config for tenant ${user.tenant_id} by user ${user.user_id}`,
    );
    return await this.configService.getPaymentConfig(user.tenant_id);
  }

  @Put('payment-config/cash-on-delivery')
  @UseGuards(JwtGuard)
  async updateCashOnDeliveryConfig(
    @CurrentUser() user: UserFromJWT,
    @Body() body: { allow_cash_on_delivery: boolean },
  ) {
    this.logger.log(
      `Updating cash on delivery config for tenant ${user.tenant_id} by user ${user.user_id}`,
    );
    return await this.configService.updateTenantCashOnDelivery(
      user.tenant_id,
      body.allow_cash_on_delivery,
    );
  }
}
