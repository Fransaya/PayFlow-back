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

@Injectable()
@WebSocketGateway({
  namespace: 'public',
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://hc8djq7q-3001.brs.devtunnels.ms',
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WebSocketGatewayPublic
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private logger: Logger = new Logger('WebSocketGatewayPublic');

  afterInit(server: Server) {
    this.logger.log('Initialized Public WebSocket Gateway');
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

  sendNewStatusOrder(tenantId: string, orderId: string, status: string) {
    this.server.to(`tenant-${tenantId}`).emit('newOrderStatus', {
      orderId,
      status,
    });
  }
}
