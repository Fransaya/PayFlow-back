import { Injectable } from '@nestjs/common';
import { WebSocketGatewayPublic } from '@src/websocket/public/WebSocketPublicGateway';
import { EmailService } from '@src/messaging/services/email.service';

// Dto
import { SendEmailDto } from '../dto/sendEmail.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly webSocketGatewayPublic: WebSocketGatewayPublic,
    private readonly emailService: EmailService,
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

  async sendEmail(body: SendEmailDto) {
    const { to, subject, message, emailRef } = body;
    return this.emailService.sendEmailDirectFromPublic(
      to,
      subject,
      message,
      emailRef,
    );
  }
}
