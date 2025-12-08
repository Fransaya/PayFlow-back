import { Injectable } from '@nestjs/common';
import { WebSocketGatewayPublic } from '@src/websocket/public/WebSocketPublicGateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly webSocketGatewayPublic: WebSocketGatewayPublic,
  ) {}

  /**
   * Enviar notificacion de actualizacion de estado de orden a cliente publico ( carrito publico )
   */
  updateOrderStatusNotificationPublic(
    tenantId: string,
    orderId: string,
    status: string,
  ): void {
    this.webSocketGatewayPublic.sendNewStatusOrder(tenantId, orderId, status);
  }
}
