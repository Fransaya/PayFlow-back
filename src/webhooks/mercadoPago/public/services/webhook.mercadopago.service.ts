/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

// Servicios utilizados
import { DbService } from '@src/libs/db';
import { MercadoPagoService } from '@src/payments/MercadoPago/services/mercado-pago.service';
import { OrderService as OrderAdminService } from '@src/modules/orders/admin/services/order.service';
import { TenantService } from '@src/modules/tenants/services/tenant.service';
import { PaymentService } from '@src/payments/admin/services/payment.service';
import { NotificationService } from '@src/modules/notifications/admin/services/notification.service';
import { NotificationService as NotificationPublicService } from '@src/modules/notifications/public/services/notification.service';

// CONSTANTES MAPEADAS DE ESTADOS
import {
  ORDER_STATUS,
  PAYMENTS_STATUS_MERCADO_PAGO,
} from '@src/constants/app.contants';

// Tipos
import { PaymentNotificationPayload } from '@src/types/notifications';

/**
 * Resultado de la validación del webhook
 */
interface WebhookValidationResult {
  isValid: boolean;
  reason?: string;
  paymentId?: string;
  userId?: string;
}

/**
 * Respuesta estándar del webhook
 */
interface WebhookResponse {
  status: 'processed' | 'ignored' | 'error';
  message: string;
  paymentId?: string;
  orderId?: string;
}

@Injectable()
export class WebhookMercadoPagoService {
  constructor(
    private readonly dbService: DbService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly orderService: OrderAdminService,
    private readonly tenantService: TenantService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
    private readonly notificationPublicService: NotificationPublicService,
  ) {}

  private readonly logger = new Logger(WebhookMercadoPagoService.name);

  /**
   * ============================================================================
   * MÉTODO PRINCIPAL: Procesa notificaciones de webhook de Mercado Pago
   * ============================================================================
   *
   * Solo procesa webhooks con formato V1 completo:
   * - Debe tener `type: 'payment'`
   * - Debe tener `action` (ej: 'payment.created', 'payment.updated')
   * - Debe tener `data.id` (ID del pago)
   * - Debe tener `user_id` (ID del collector de MP)
   *
   * Ignora:
   * - Webhooks de tipo `merchant_order`
   * - Webhooks legacy con solo `resource` y `topic`
   */
  async handlePaymentNotification(data: any): Promise<WebhookResponse> {
    const startTime = Date.now();

    try {
      // 1. Log del webhook recibido
      this.logWebhookReceived(data);

      // 2. Validar formato del webhook
      const validation = this.validateWebhook(data);
      if (!validation.isValid) {
        this.logger.debug(`Webhook ignored: ${validation.reason}`);
        return {
          status: 'ignored',
          message: validation.reason || 'Invalid webhook format',
        };
      }

      const { paymentId, userId } = validation;

      // 3. Obtener configuración del tenant por MP user_id
      const tenantConfig = await this.getTenantConfig(userId!);
      if (!tenantConfig) {
        return { status: 'ignored', message: 'Tenant configuration not found' };
      }

      const { tenantId } = tenantConfig;

      // 4. Obtener información del pago desde MP API
      const paymentInfo = await this.getPaymentInfo(paymentId!, tenantId);
      if (!paymentInfo) {
        return { status: 'ignored', message: 'Payment info not found' };
      }

      // 5. Extraer y validar orderId del external_reference
      const orderId = this.extractOrderId(paymentInfo.external_reference);
      if (!orderId) {
        return { status: 'ignored', message: 'Invalid external reference' };
      }

      // 6. Procesar el pago (actualizar estados y notificar)
      await this.processPayment(tenantId, orderId, paymentInfo);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Payment ${paymentId} processed successfully for order ${orderId} (${processingTime}ms)`,
      );

      return {
        status: 'processed',
        message: 'Webhook processed successfully',
        paymentId: paymentId!,
        orderId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error processing webhook: ${errorMessage}`);
      throw new InternalServerErrorException('Error processing webhook');
    }
  }

  /**
   * ============================================================================
   * VALIDACIÓN DEL WEBHOOK
   * ============================================================================
   *
   * Valida que el webhook tenga el formato V1 completo de Mercado Pago.
   * Rechaza webhooks legacy y de merchant_order.
   */
  private validateWebhook(data: any): WebhookValidationResult {
    // Verificar que sea un objeto
    if (!data || typeof data !== 'object') {
      return { isValid: false, reason: 'Invalid webhook: not an object' };
    }

    // Caso 1: Webhook legacy con solo 'topic' (merchant_order o payment legacy)
    // Formato: {"resource":"...","topic":"merchant_order"} o {"resource":"...","topic":"payment"}
    if (data.topic && !data.action) {
      return {
        isValid: false,
        reason: `Legacy webhook format ignored (topic: ${data.topic})`,
      };
    }

    // Caso 2: Verificar que sea tipo 'payment'
    if (data.type !== 'payment') {
      return {
        isValid: false,
        reason: `Webhook type '${data.type || 'undefined'}' not handled`,
      };
    }

    // Caso 3: Verificar campos requeridos del formato V1
    if (!data.action || typeof data.action !== 'string') {
      return { isValid: false, reason: 'Missing or invalid action field' };
    }

    if (!data.data || typeof data.data !== 'object') {
      return { isValid: false, reason: 'Missing or invalid data field' };
    }

    if (!data.data.id) {
      return { isValid: false, reason: 'Missing payment ID in data.id' };
    }

    if (!data.user_id) {
      return { isValid: false, reason: 'Missing user_id (collector ID)' };
    }

    // Webhook válido - formato V1 completo
    return {
      isValid: true,
      paymentId: String(data.data.id),
      userId: String(data.user_id),
    };
  }

  /**
   * ============================================================================
   * OBTENER CONFIGURACIÓN DEL TENANT
   * ============================================================================
   */
  private async getTenantConfig(
    mpUserId: string,
  ): Promise<{ tenantId: string } | null> {
    const config =
      await this.mercadoPagoService.getTenantConfigByMpUserId(mpUserId);

    if (!config?.tenantId) {
      this.logger.warn(`No tenant config found for MP user: ${mpUserId}`);
      return null;
    }

    return { tenantId: config.tenantId };
  }

  /**
   * ============================================================================
   * OBTENER INFORMACIÓN DEL PAGO DESDE MP API
   * ============================================================================
   */
  private async getPaymentInfo(
    paymentId: string,
    tenantId: string,
  ): Promise<any> {
    const paymentInfo = await this.mercadoPagoService.getPaymentInfo(
      paymentId,
      tenantId,
    );

    if (!paymentInfo || paymentInfo.status === 'ignored') {
      this.logger.warn(
        `Payment info not found for payment ${paymentId}, tenant ${tenantId}`,
      );
      return null;
    }

    return paymentInfo;
  }

  /**
   * ============================================================================
   * EXTRAER ORDER ID DEL EXTERNAL REFERENCE
   * ============================================================================
   */
  private extractOrderId(externalReference: any): string | null {
    if (!externalReference || typeof externalReference !== 'string') {
      this.logger.warn(
        `Invalid external_reference: ${String(externalReference)}`,
      );
      return null;
    }

    // Por ahora el external_reference es directamente el orderId
    // TODO: Si en el futuro cambias el formato, actualizar esta lógica
    return externalReference.split('|')[0];
  }

  /**
   * ============================================================================
   * PROCESAR PAGO: Actualizar estados y enviar notificaciones
   * ============================================================================
   */
  private async processPayment(
    tenantId: string,
    orderId: string,
    paymentInfo: any,
  ): Promise<void> {
    const mpStatus = String(paymentInfo.status || 'unknown');

    // 1. Mapear estado del pago de MP a estado interno
    const mappedPaymentStatus =
      PAYMENTS_STATUS_MERCADO_PAGO[mpStatus] || 'UNKNOWN';

    // 2. Mapear estado de la orden
    const mappedOrderStatus = this.mapPaymentStatusToOrderStatus(mpStatus);

    // 3. Actualizar estado del pago en DB
    await this.paymentService.updatePaymentStatusByOrderId(
      tenantId,
      orderId,
      mappedPaymentStatus,
    );

    // 4. Actualizar estado de la orden en DB
    await this.orderService.updateOrderStatus(
      tenantId,
      orderId,
      mappedOrderStatus,
    );

    // 5. Construir y enviar notificación WebSocket
    const notificationPayload = this.buildNotificationPayload(
      tenantId,
      orderId,
      mappedOrderStatus,
      paymentInfo,
    );

    this.notificationPublicService.updateOrderStatusNotificationPublic(
      tenantId,
      orderId,
      mappedOrderStatus,
    );

    this.notificationService.sendNewPaymentStatus(
      tenantId,
      notificationPayload,
    );

    this.logger.debug(
      `Payment processed: status=${mpStatus} → order=${mappedOrderStatus}`,
    );
  }

  /**
   * ============================================================================
   * MAPEAR ESTADO DE PAGO MP → ESTADO DE ORDEN
   * ============================================================================
   */
  private mapPaymentStatusToOrderStatus(mpStatus: string): string {
    const statusMap: Record<string, string> = {
      approved: ORDER_STATUS.PAID,
      pending: ORDER_STATUS.PENDING_PAYMENT,
      in_process: ORDER_STATUS.PENDING_PAYMENT,
      cancelled: ORDER_STATUS.CANCELLED,
      rejected: ORDER_STATUS.REJECTED,
      refunded: ORDER_STATUS.REFUNDED,
      charged_back: ORDER_STATUS.CHARGED_BACK,
    };

    return statusMap[mpStatus] || ORDER_STATUS.PENDING_PAYMENT;
  }

  /**
   * ============================================================================
   * CONSTRUIR PAYLOAD DE NOTIFICACIÓN
   * ============================================================================
   */
  private buildNotificationPayload(
    tenantId: string,
    orderId: string,
    mappedOrderStatus: string,
    paymentInfo: any,
  ): PaymentNotificationPayload {
    return {
      tenantId,
      orderId,
      mappedOrderStatus,
      transactionAmount: paymentInfo.transaction_amount || 0,
      currencyId: paymentInfo.currency_id || 'ARS',
      mpPaymentId: paymentInfo.id,
      mpStatusDetail: paymentInfo.status_detail || '',
      customerEmail: paymentInfo.payer?.email || '',
      customerName: this.extractCustomerName(paymentInfo),
      paymentMethod: paymentInfo.payment_method_id || '',
      dateApproved: paymentInfo.date_approved || new Date().toISOString(),
    };
  }

  /**
   * ============================================================================
   * EXTRAER NOMBRE DEL CLIENTE
   * ============================================================================
   */
  private extractCustomerName(paymentInfo: any): string {
    const firstName = String(paymentInfo.payer?.first_name || '');
    const lastName = String(paymentInfo.payer?.last_name || '');
    const fullName = `${firstName} ${lastName}`.trim();

    // Si no hay nombre en payer, intentar obtenerlo de additional_info
    if (!fullName && paymentInfo.additional_info?.payer?.first_name) {
      return String(paymentInfo.additional_info.payer.first_name);
    }

    return fullName || 'Cliente';
  }

  /**
   * ============================================================================
   * LOG DEL WEBHOOK RECIBIDO
   * ============================================================================
   */
  private logWebhookReceived(data: any): void {
    const summary = this.getWebhookSummary(data);
    this.logger.log(`📥 Webhook received: ${summary}`);
  }

  /**
   * Genera un resumen corto del webhook para logging
   */
  private getWebhookSummary(data: any): string {
    if (!data || typeof data !== 'object') return 'invalid';

    // Formato V1 (el que procesamos)
    if (data.action && data.type) {
      return `type=${data.type}, action=${data.action}, payment_id=${data.data?.id || 'N/A'}`;
    }

    // Formato legacy (ignoramos)
    if (data.topic) {
      return `topic=${data.topic} (legacy format - ignored)`;
    }

    return JSON.stringify(data).substring(0, 100);
  }
}
