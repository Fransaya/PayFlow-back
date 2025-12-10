import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

import { PhoneHelper } from '@src/helpers/phone.helper';

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
    this.apiUrl = `https://graph.facebook.com/v17.0/${phoneId}`;
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
          language: { code: 'es_AR' },
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
                  text: `https://hc8djq7q-3001.brs.devtunnels.ms/${slug_tenant}/order/tracking/${order_id}`, // Ejemplo de URL, puede ser dinámico
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
