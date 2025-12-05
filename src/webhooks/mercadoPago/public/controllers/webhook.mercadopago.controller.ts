import { Controller, Post, Body } from '@nestjs/common';

import { WebhookMercadoPagoService } from '../services/webhook.mercadopago.service';

@Controller('webhook/mercado-pago')
export class WebhookMercadoPagoController {
  constructor(
    private readonly webhookMercadoPagoService: WebhookMercadoPagoService,
  ) {}

  /**
   * Endpoint para recibir notificaciones de Mercado Pago.
   */
  @Post('notification')
  async handleNotification(@Body() body: any) {
    await this.webhookMercadoPagoService.handlePaymentNotification(body);
    return { status: 'received' };
  }
}
