import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

import { PhoneHelper } from '@src/helpers/phone.helper';
import { ORDER_STATUS } from '@src/constants/app.contants';

// Helper: Traducir estados de órdenes al español
export function translateOrderStatus(status: string): string {
  const translations: Record<string, string> = {
    [ORDER_STATUS.DRAFT]: 'Borrador',
    [ORDER_STATUS.PENDING_PAYMENT]: 'Pendiente de pago',
    [ORDER_STATUS.PAID]: 'Pagado',
    [ORDER_STATUS.ACCEPTED]: 'Aceptado',
    [ORDER_STATUS.IN_PREPARATION]: 'En preparación',
    [ORDER_STATUS.READY]: 'Listo para retirar',
    [ORDER_STATUS.OUT_FOR_DELIVERY]: 'En camino',
    [ORDER_STATUS.DELIVERED]: 'Entregado',
    [ORDER_STATUS.CANCELLED]: 'Cancelado',
    [ORDER_STATUS.REJECTED]: 'Rechazado',
    [ORDER_STATUS.REFUNDED]: 'Reembolsado',
    [ORDER_STATUS.CHARGED_BACK]: 'Contracargo',
  };
  return translations[status] || status;
}

// Helper: Formatear monto en pesos argentinos
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

// Helper: Obtener últimos caracteres del ID
export function getShortOrderId(orderId: string, length: number = 8): string {
  return orderId.slice(-length).toUpperCase();
}

@Injectable()
export class WhatsAppServide {
  private readonly logger = new Logger(WhatsAppServide.name);
  private apiUrl: string;
  private token: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const phoneId = this.configService.get<string>('WHATSAPP_PHONE_ID');
    this.token = this.configService.get<string>('WHATSAPP_TOKEN') || '';
    this.apiUrl = `https://graph.facebook.com/v24.0/${phoneId}`;
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    variables: string[],
    slug_tenant: string,
    order_id: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Validación de parámetros
      if (!to || !templateName) {
        this.logger.warn('Missing required parameters: to or templateName');
        return {
          success: false,
          error: 'Missing required parameters',
        };
      }

      // Validación de configuración
      if (!this.token || !this.apiUrl) {
        this.logger.error('WhatsApp service not configured properly');
        return {
          success: false,
          error: 'WhatsApp service not configured',
        };
      }

      // Estructura de parametros requeridos por meta
      const parameters = variables.map((value) => ({
        type: 'text',
        text: value,
      }));

      const payload = {
        messaging_product: 'whatsapp',
        to: PhoneHelper.normalizeWhatsApp(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: parameters,
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: `${slug_tenant}/order/tracking/${order_id}`, // {{1}} - sufijo completo
                },
              ],
            },
          ],
        },
      };

      const { data } = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/messages`, payload, {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos
        }),
      );

      this.logger.log(
        `WhatsApp message sent to ${to}: ${JSON.stringify(data)}`,
      );
      return { success: true, data };
    } catch (err) {
      // console.log('complete error', err);
      const error = err as AxiosError<{
        error?: { message?: string; code?: string };
      }>;

      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        'Unknown error';
      const errorCode = error.response?.data?.error?.code || 'UNKNOWN';

      this.logger.error(
        `Failed to send WhatsApp message to ${to}: [${errorCode}] ${errorMessage}`,
      );

      // No propagar el error para evitar crasheo de la app
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
