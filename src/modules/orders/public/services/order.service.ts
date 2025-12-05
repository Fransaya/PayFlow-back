/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  DbService,
  orderRepo,
  productRepo,
  productVariantRepo,
} from '@src/libs/db';

// Servicios externos
import { MercadoPagoService } from '@src/payments/MercadoPago/services/mercado-pago.service';
import { TenantService } from '@src/modules/tenants/services/tenant.service';
import { PaymentService } from '@src/payments/admin/services/payment.service';
import { NotificationService } from '@src/modules/notifications/admin/services/notification.service';

// Servicio de configuracion para obtener variables de entorno
import { ConfigService } from '@nestjs/config';

// CONSTANTES MAPEADAS DE ESTADOS
import { PAYMENTS_STATUS, ORDER_STATUS } from '@src/constants/app.contants';

@Injectable()
export class OrderService {
  constructor(
    private readonly dbService: DbService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly tenantService: TenantService,
    private readonly configService: ConfigService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly logger = new Logger(OrderService.name + '-Public');

  // Obtener estado de orden por ID
  async getOrderStatus(tenantId: string, orderId: string) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return orderRepo(tx).getOrderStatus(orderId);
    });
  }

  // Obtener detalle completo de la orden, por ID
  async getOrderDetails(tenantId: string, orderId: string) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return orderRepo(tx).getOrderDetails(orderId);
    });
  }

  // Crear orden
  async createOrder(tenantId: string, data: any) {
    try {
      // PASO 1: obtengo productos actualizados de la DB para validar precios y existencia
      const productsIds = data.items.map((item) => item.product_id);
      const realProducts = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          return productRepo(tx).getProductsByIds(tenantId, productsIds);
        },
      );

      // PASO 2: Valido y reacalulo los items
      const validatedItems = data.items.map(async (item) => {
        const realProduct = realProducts.find(
          (p) => p.product_id === item.product_id,
        );
        if (!realProduct) {
          throw new Error(`Producto con ID ${item.product_id} no encontrado`);
        }

        if (!realProduct)
          throw new BadRequestException(
            `Producto ${item.product_id} no encontrado`,
          );
        if (!realProduct.visible)
          throw new BadRequestException(`Producto no disponible`);
        if (realProduct.stock && realProduct.stock < item.quantity)
          throw new BadRequestException(`Stock insuficiente`);

        // Calculo de precio real (producto + variantes )
        const realPrice = await this.calculateItemPrice(
          tenantId,
          item.product_id,
          item.variant_id,
        );

        return {
          ...item,
          unit_price: realPrice, // ← Precio REAL de la DB
          subtotal: realPrice * item.quantity,
        };
      });

      const resolvedItems = await Promise.all(validatedItems);

      // 3. Recalcular total
      const realTotal = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);

      // 3.1 Construir el cart_json con los items validados y datos del customer
      const cartJson = {
        customer: {
          name: data.customer?.name || 'Cliente sin nombre',
          email: data.customer?.email || null,
          phone: data.customer?.phone
            ? {
                area_code: data.customer.phone.area_code || '',
                number: data.customer.phone.number || '',
              }
            : null,
          address: data.customer?.address
            ? {
                street_name: data.customer.address.street_name || '',
                street_number: data.customer.address.street_number || null,
                zip_code: data.customer.address.zip_code || '',
                city: data.customer.address.city || '',
                state: data.customer.address.state || '',
                country: data.customer.address.country || 'AR',
              }
            : null,
          notes: data.customer?.notes || null,
          identification: data.customer?.identification
            ? {
                type: data.customer.identification.type || 'DNI',
                number: data.customer.identification.number || '',
              }
            : null,
        },
        items: resolvedItems.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          name: item.product_name,
          variant_name: item.variant_name || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency: data.currency || 'ARS',
          modifiers: item.selected_variants || [],
          image_url: item.image_url || null,
        })),
        subtotal: realTotal,
        discounts: data.discounts || [],
        delivery_fee: data.delivery_fee || 0,
        tips: data.tips || 0,
        total: realTotal + (data.delivery_fee || 0) + (data.tips || 0),
        currency: data.currency || 'ARS',
        session_id: data.session_id || null,
        tenant_id: tenantId,
        version: 1,
        created_at: new Date().toISOString(),
      };

      // 4. Crear orden y detalles en la DB
      const orderRecord = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const newOrder = await orderRepo(tx).createOrder({
            tenant_id: tenantId,
            source_channel: data.source_channel || 'public',
            status: ORDER_STATUS.PENDING_PAYMENT,
            total_amount: realTotal,
            currency: data.currency || 'ARS',
            cart_json: cartJson,
            mp_preference_id: data.mp_preference_id || null,
            mp_merchant_order_id: data.mp_merchant_order_id || null,
          });

          // Crear detalles de orden
          for (const item of resolvedItems) {
            await orderRepo(tx).createOrderItem({
              order_id: newOrder.order_id,
              product_id: item.product_id,
              variant_id: item.variant_id || null,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount: item.discount || null,
            });
          }

          return newOrder;
        },
      );

      // 5- Valido configuracion de mercado pago asociado al tenant  antes de crear order
      const configStatus =
        await this.mercadoPagoService.getPaymentConfigStatus(tenantId);

      // Valido unicamente que este conectado
      if (!configStatus.isConnected) {
        this.logger.warn(
          `Mercado Pago no está configurado para el negocio ${tenantId} - Se intento crear orden ${orderRecord.order_id}`,
        );
        throw new BadRequestException(
          'Mercado Pago no está configurado para este negocio.',
        );
      }

      // Variable para seteo de datos ( configuracion de mercado pago del negocio )

      // Valido expiracion de token
      if (
        configStatus.expirationDate &&
        configStatus.expirationDate < new Date()
      ) {
        //* el access token expiró, el negocio sigue conectado - se realizar proceso de renovacion en background asyncrono
        this.logger.warn(
          `Token de Mercado Pago expirado para el negocio ${tenantId} - Se intento crear orden ${orderRecord.order_id}`,
        );
        //TODO: implementar logica de renovacion  asyncrona para obtener nuevo access token y utilizarlo para crear preferencia.
      }

      // Obtengo datos de configuracion para crear preferencia
      const mpConfig = await this.mercadoPagoService.getAccessToken(tenantId);

      if (!mpConfig) {
        this.logger.error(
          `No se pudo obtener configuración de Mercado Pago para el negocio ${tenantId} - Se intento crear orden ${orderRecord.order_id}`,
        );
        throw new InternalServerErrorException(
          'Error obteniendo configuración de Mercado Pago.',
        );
      }

      const access_token_mp = mpConfig;

      // Obtengo URL del frontend desde variables de entorno
      const frontendBaseUrl = this.configService.get<string>(
        'FRONTEND_BASE_MP_URL',
      );

      // Obtengo info completa del tenant para armar las URLs de callback
      const tenantInfo = await this.tenantService.getTenantInfo(tenantId);

      if (!tenantInfo) {
        this.logger.error(
          `No se pudo obtener información del tenant ${tenantId} - Se intento crear orden ${orderRecord.order_id}`,
        );
        throw new InternalServerErrorException(
          'Error obteniendo información del negocio.',
        );
      }

      const slug = tenantInfo.slug || 'default-tenant';
      const customDomain = tenantInfo.custom_domain || null;

      const baseReturnUrl = customDomain
        ? `https://${customDomain}`
        : `${frontendBaseUrl}/${slug}`;

      const notificationUrl = `${this.configService.get<string>(
        'MERCADOPAGO_WEBHOOK_URL',
      )}/webhook/mercado-pago/notification`;

      // Estructuro objeto con productos y montos validados para crear preferencia de pago
      const preferenceData = {
        payer: {
          name: data.customer.name,
          email: data.customer.email,
          phone: {
            area_code: data.customer.phone
              ? data.customer.phone.area_code
              : '00',
            number: data.customer.phone
              ? data.customer.phone.number
              : '00000000',
          },
          address: {
            street_name: data.customer.address
              ? data.customer.address.street_name
              : 'N/A',
            street_number: data.customer.address
              ? data.customer.address.street_number
              : 0,
            zip_code: data.customer.address
              ? data.customer.address.zip_code
              : 'N/A',
          },
        },
        items: resolvedItems.map((item) => ({
          title: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: data.currency,
        })),
        total: realTotal,
        currency: data.currency,
        external_reference: orderRecord.order_id,
        back_urls: {
          success: `${baseReturnUrl}/order/success`,
          failure: `${baseReturnUrl}/order/failure`,
          pending: `${baseReturnUrl}/order/pending`,
        },
        auto_return: 'approved',
        notification_url: notificationUrl,
      };

      // 5 - creo instancia de pago de mercado pago
      const preferenceCreated =
        await this.mercadoPagoService.createPreferencePayment(
          tenantId,
          preferenceData,
          access_token_mp,
        );

      // 6 - actualizo orden con datos de preferencia creada
      await this.dbService.runInTransaction({ tenantId }, async (tx) => {
        await orderRepo(tx).updateOrderPaymentInfo(orderRecord.order_id, {
          mp_preference_id: preferenceCreated.id,
          mp_merchant_order_id: preferenceCreated.merchant_order_id,
        });
      });

      // 7- creo instancia de payment en la base de datos ( Payment Service ) - IN PROGRESS
      await this.paymentService.createPayment({
        tenant_id: tenantId,
        order_id: orderRecord.order_id,
        mp_payment_id: preferenceCreated.id,
        status: PAYMENTS_STATUS.IN_PROGRESS,
        method: null,
        amount: realTotal,
        currency: data.currency,
        raw_json: preferenceCreated,
      });

      // 8- retorno orden creada
      const orderWithPaymentInfo = {
        ...orderRecord,
        mp_preference_id: preferenceCreated.id,
        mp_merchant_order_id: preferenceCreated.merchant_order_id,
      };

      const orderCreated = {
        init_point: preferenceCreated.init_point,
        order: orderWithPaymentInfo,
      };

      this.notificationService.sendNewOrderNotification(tenantId, orderCreated);

      return orderCreated;
    } catch (error) {
      this.logger.error('Error creando orden:', error);
      throw new InternalServerErrorException('Error creando la orden');
    }
  }

  // Metodo para el calculo de precio real de un item ( producto + variantes )
  private async calculateItemPrice(
    tenant_id: string,
    product_id: string,
    variant_id: string,
  ) {
    try {
      const realProduct: any = await this.dbService.runInTransaction(
        { tenantId: tenant_id },
        async (tx) => {
          return productRepo(tx).getProductById(tenant_id, product_id);
        },
      );

      let realVariant: any | null = null;
      if (variant_id) {
        const variant = await this.dbService.runInTransaction(
          { tenantId: tenant_id },
          async (tx) => {
            return productVariantRepo(tx).getProductVariantByProductId(
              product_id,
            );
          },
        );

        realVariant = variant;
      }

      let finalPrice = Number(realProduct.price);
      if (realVariant) {
        finalPrice += Number(realVariant.price_delta);
      }

      return finalPrice;
    } catch (error) {
      this.logger.error('Error calculando precio del item:', error);
      throw new InternalServerErrorException(
        'Error calculando precio del item',
      );
    }
  }
}
