import { Controller, Post, Param, Body, Get } from '@nestjs/common';

import { OrderService } from '../services/order.service';

// DTO de tipado

@Controller('orders/public')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get(':tenantId/status/:orderId')
  async getOrderStatus(
    @Param('tenantId') tenantId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.getOrderStatus(tenantId, orderId);
  }

  @Post(':tenantId/create')
  async createOrder(@Param('tenantId') tenantId: string, @Body() data: any) {
    return this.orderService.createOrder(tenantId, data);
  }
}
