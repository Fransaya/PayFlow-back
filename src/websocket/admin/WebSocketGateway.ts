/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

import { PaymentNotificationPayload } from '@src/types/notifications';

@Injectable()
@WebSocketGateway({
  namespace: 'admin',
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
export class WebSocketGatewayAdmin
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private logger: Logger = new Logger('WebSocketGatewayAdmin');

  afterInit(server: Server) {
    this.logger.log('Initialized Admin WebSocket Gateway');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTenantRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tenantId: string },
  ): void {
    const { tenantId } = payload;
    // Lógica para que el socket se una a la sala.
    client.join(`tenant-${tenantId}`);
    client.emit(
      'joinedRoom',
      `Conexion con servidor websocket establecida-${tenantId}`,
    );
  }

  // 2. Evento para que el CLIENTE solicite recargar la lista de órdenes (un pull manual)
  @SubscribeMessage('requestOrderList')
  handleRequestOrders(@ConnectedSocket() client: Socket): { status: string } {
    // Aquí podrías llamar al OrderService y enviar la lista de pedidos de vuelta al cliente
    // this.orderService.getRecentOrders(client.tenantId);
    console.log(`Cliente ${client.id} solicita recarga de pedidos.`);
    return { status: 'processing' };
  }

  // 3. Evento para enviar una notificacion al panel de admin ( pedidos ) cuando se cree una nueva orden
  sendNewOrderNotification(tenantId: string, order: any): void {
    this.server
      .to(`tenant-${tenantId}`)
      .emit('newOrderNotification', { order });
  }

  // 4. Evento para enviar notificacion al cliente de actualizacion de estado de orden
  sendOrderStatusUpdate(tenantId: string, order: any): void {
    this.server.to(`tenant-${tenantId}`).emit('orderStatusUpdate', { order });
  }

  // 5- Evento para notificar pago completado ( recibido )
  sendNewPaymentStatus(
    tenantId: string,
    payment: PaymentNotificationPayload,
  ): void {
    this.server
      .to(`tenant-${tenantId}`)
      .emit('paymentStatusUpdated', { payment });
  }
}
