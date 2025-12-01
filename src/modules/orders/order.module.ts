import { Module } from '@nestjs/common';
import { OrderController } from './public/controllers/order.controller';
import { OrderService } from './public/services/order.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
