import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { OrderService } from '../services/order.service';

import { JwtGuard } from '@src/guards/jwt.guard';

import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

import { UserFromJWT } from '@src/types/userFromJWT';
import { OrdersFilterDto } from '../dto/orderFilter.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Endpoint para obtener todas las órdenes (Admin)
  @Get()
  @UseGuards(JwtGuard)
  async getAllOrders(
    @CurrentUser() user: UserFromJWT,
    @Query() filters: OrdersFilterDto,
    // Aquí podrías agregar decoradores para recibir filtros desde query params
  ) {
    const tenantId = user.tenant_id || '';
    return this.orderService.getAllOrders(tenantId, filters);
  }

  @Get(':orderId')
  @UseGuards(JwtGuard)
  async getOrderById(
    @CurrentUser() user: UserFromJWT,
    @Param('orderId') orderId: string,
    // Aquí podrías agregar decoradores para recibir orderId desde params
  ) {
    const tenantId = user.tenant_id || '';
    return this.orderService.getOrderById(tenantId, orderId);
  }

  // Endpoint para actualizar el estado de una orden (Admin)
  @Put(':orderId/status')
  @UseGuards(JwtGuard)
  async updateOrderStatus(
    @CurrentUser() user: UserFromJWT,
    @Param('orderId') orderId: string,
    @Body('status') status: string,
    // Aquí podrías agregar decoradores para recibir orderId y nuevo estado desde params/body
  ) {
    const tenantId = user.tenant_id || '';

    return this.orderService.updateOrderStatus(tenantId, orderId, status);
  }
}
