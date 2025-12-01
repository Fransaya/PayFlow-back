import { Controller, Post, Param, Body } from '@nestjs/common';

import { OrderService } from '../services/order.service';

@Controller('orders/public')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post(':tenantId/create')
  async createOrder(@Param('tenantId') tenantId: string, @Body() data: any) {
    return this.orderService.createOrder(tenantId, data);
  }
}
