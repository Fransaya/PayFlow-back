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
import { StorageService } from '@src/storage/storage.service';

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
    private readonly storageService: StorageService,
  ) {}

  private readonly logger = new Logger(OrderService.name + '-Public');

  // Obtener estado de orden por ID
  async getOrderStatus(tenantId: string, orderId: string) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return orderRepo(tx).getPublicOrderById(orderId, tenantId);
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
      const productsIds = data.items.map((item: any) => item.product_id);
      const realProducts = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          return productRepo(tx).getProductsByIds(tenantId, productsIds);
        },
      );

      // Extraer todos los variant_ids de todos los items
      const variantsIds: string[] = [];
      data.items.forEach((item: any) => {
        if (item.selected_variants && Array.isArray(item.selected_variants)) {
          item.selected_variants.forEach((variant: any) => {
            if (variant.variant_id) {
              variantsIds.push(variant.variant_id);
            }
          });
        }
      });

      // Obtener variantes reales de la DB si hay IDs
      let realVariants: any[] = [];
      if (variantsIds.length > 0) {
        realVariants = await this.dbService.runInTransaction(
          { tenantId },
          async (tx) => {
            return productVariantRepo(tx).getProductVariantsByIds(variantsIds);
          },
        );
      }

      // PASO 2: Valido y recalculo los items
      const validatedItems = data.items.map((item: any) => {
        const realProduct = realProducts.find(
          (p) => p.product_id === item.product_id,
        );

        // Validar existencia del producto
        if (!realProduct) {
          throw new BadRequestException(
            `Producto con ID ${item.product_id} no encontrado`,
          );
        }

        // Validar disponibilidad
        if (!realProduct.visible) {
          throw new BadRequestException(
            `Producto "${realProduct.name}" no está disponible`,
          );
        }

        // Validar stock del producto
        if (realProduct.stock !== null && realProduct.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${realProduct.name}". Disponible: ${realProduct.stock}`,
          );
        }

        // Calcular precio base del producto
        let realPrice = Number(realProduct.price);

        // Procesar y validar variantes seleccionadas
        const validatedVariants: any[] = [];
        if (item.selected_variants && Array.isArray(item.selected_variants)) {
          item.selected_variants.forEach((selectedVariant: any) => {
            const realVariant = realVariants.find(
              (rv) => rv.variant_id === selectedVariant.variant_id,
            );

            if (!realVariant) {
              throw new BadRequestException(
                `Variante con ID ${selectedVariant.variant_id} no encontrada`,
              );
            }

            // Validar que la variante pertenezca al producto
            if (realVariant.product_id !== item.product_id) {
              throw new BadRequestException(
                `La variante "${realVariant.name}" no pertenece al producto "${realProduct.name}"`,
              );
            }

            // Validar que la variante esté activa
            if (!realVariant.active) {
              throw new BadRequestException(
                `La variante "${realVariant.name}" no está disponible`,
              );
            }

            // Validar stock de la variante
            if (
              realVariant.stock !== null &&
              realVariant.stock < item.quantity
            ) {
              throw new BadRequestException(
                `Stock insuficiente para la variante "${realVariant.name}". Disponible: ${realVariant.stock}`,
              );
            }

            // Sumar el price_delta al precio total
            realPrice += Number(realVariant.price_delta || 0);

            // Guardar información validada de la variante
            validatedVariants.push({
              variant_id: realVariant.variant_id,
              name: realVariant.name,
              price_delta: Number(realVariant.price_delta || 0),
              sku: realVariant.sku,
            });
          });
        }

        // console.log('realProduct', realProduct);
        // console.log('item', item);

        // Calcular subtotal
        const subtotal = realPrice * item.quantity;

        return {
          product_id: item.product_id,
          product_name: realProduct.name,
          quantity: item.quantity,
          unit_price: realPrice, // Precio REAL (producto + variantes)
          subtotal: subtotal,
          selected_variants: validatedVariants,
          discount: item.discount || null,
          image_url: item.image_url || realProduct.image_url || null,
        };
      });

      // 3. Recalcular total
      const realTotal = validatedItems.reduce((sum, i) => sum + i.subtotal, 0);

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
        items: validatedItems.map((item) => ({
          product_id: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price, // Precio unitario ya incluye variantes
          subtotal: item.subtotal,
          currency: data.currency || 'ARS',
          selected_variants: item.selected_variants, // Array con las variantes validadas
          image_url: item.image_url || null, //TODO: hacer llamara a storage service para presigned de url
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
            // Campos de cliente
            customer_name: data.customer?.name || 'Cliente sin',
            customer_phone:
              data.customer?.phone.area_code + data.customer?.phone.number ||
              null,
            customer_email: data.customer?.email || null,
            // Campos de entreg
            delivery_method: data.delivery_method || 'delivery',
            delivery_address: JSON.stringify(data.delivery_address) || null, //* esto es porque es JSONB

            // Nota adicional
            aditional_note: data.aditional_note || null,

            // Campos de pago
            payment_method: data.payment_method || 'mercado_pago',
            shipping_cost: data.delivery_fee || 0,

            total_amount: realTotal,
            currency: data.currency || 'ARS',
            cart_json: cartJson,
            mp_preference_id: data.mp_preference_id || null,
            mp_merchant_order_id: data.mp_merchant_order_id || null,
          });

          // Crear detalles de orden
          for (const item of validatedItems) {
            await orderRepo(tx).createOrderItem({
              order_id: newOrder.order_id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price, // Ya incluye el precio de las variantes
              discount: item.discount || null,
              selected_variants:
                item.selected_variants.length > 0
                  ? item.selected_variants
                  : null, // Guardar variantes como JSON
            });
          }

          return newOrder;
        },
      );

      // 4.1 Extraigo metodo de pago seleccionado para validaciones
      const paymentMethod = data.payment_method || 'mercado_pago';

      // 5- Valido configuracion de mercado pago asociado al tenant  antes de crear order
      if (paymentMethod === 'mercado_pago') {
        //* LOGICA PARA PAGO CON MERCADO PAGO
        const configData =
          await this.mercadoPagoService.getPaymentConfigStatus(tenantId);

        // Valido unicamente que este conectado
        if (!configData.isConnected || !configData.config) {
          this.logger.warn(
            `Mercado Pago no está configurado para el negocio ${tenantId} - Se intento crear orden ${orderRecord.order_id}`,
          );
          throw new BadRequestException(
            'Mercado Pago no está configurado para este negocio.',
          );
        }

        // Obtengo datos de configuracion para crear preferencia
        const mpConfig = await this.mercadoPagoService.getAccessToken(
          tenantId,
          configData.config,
        );

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

        // Asegura que un pedido no se page 5 horas despues cuando no hay stock.
        const dateNow = new Date();
        const dateExpiration = new Date(dateNow.getTime() + 30 * 60000); // Suma 30 minutos

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
          items: validatedItems.map((item) => {
            // Construir título descriptivo incluyendo variantes
            let title = item.product_name;
            if (item.selected_variants && item.selected_variants.length > 0) {
              const variantNames = item.selected_variants
                .map((v: any) => v.name)
                .join(', ');
              title += ` (${variantNames})`;
            }

            return {
              title: title,
              quantity: item.quantity,
              unit_price: item.unit_price, // Precio con variantes incluidas
              currency_id: data.currency,
            };
          }),
          total: realTotal,
          currency: data.currency,
          external_reference: orderRecord.order_id + '|' + tenantId,
          back_urls: {
            success: `${baseReturnUrl}/order/success`,
            failure: `${baseReturnUrl}/order/failure`,
            pending: `${baseReturnUrl}/order/pending`,
          },
          auto_return: 'approved',
          notification_url: notificationUrl,
          // 3. HARDCODED: Configuraciones de seguridad de cobro
          binary_mode: true, // ESENCIAL: Solo acepta Aprobado o Rechazado (nada de pendientes)
          expires: true, // Activa la expiración
          expiration_date_from: dateNow.toISOString(), // Inicio: Ahora
          expiration_date_to: dateExpiration.toISOString(),
          // 4. MIXTO: Aquí entra la configuración
          payment_methods: {
            // HARDCODED: Bloqueamos lo que no es inmediato
            excluded_payment_types: [
              { id: 'ticket' }, // Chau Rapipago/PagoFácil
              { id: 'atm' }, // Chau Cajero Automático
              { id: 'bank_transfer' }, // Chau Transferencia manual (opcional, recomendado bloquear en checkout pro viejo)
            ],

            // CONFIGURABLE POR EL USUARIO (Inyecta aquí tus variables de configuración)
            installments: configData.config.maxIntallments || 1, // Por defecto 1, o lo que diga el usuario

            excluded_payment_methods: [
              // Ejemplo: Si el usuario desactiva AMEX en su panel
              ...(configData.config.excludedPaymentsTypes || []),
            ],
          },
          statement_descriptor: `PEDILO*${tenantInfo.name.substring(0, 10)}`,
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
        this.notificationService.sendNewOrderNotification(
          tenantId,
          orderCreated,
        );

        return orderCreated;
      } else {
        //* LOGICA PARA PAGO CON EFECTIVO
        // 7- creo instancia de payment en la base de datos ( Payment Service ) - IN PROGRESS
        await this.paymentService.createPayment({
          tenant_id: tenantId,
          order_id: orderRecord.order_id,
          mp_payment_id: null,
          status: PAYMENTS_STATUS.IN_PROGRESS,
          method: null,
          amount: realTotal,
          currency: data.currency,
          raw_json: null,
        });

        // 8- retorno orden creada
        const orderWithPaymentInfo = {
          ...orderRecord,
          mp_preference_id: null,
          mp_merchant_order_id: null,
        };

        const orderCreated = {
          init_point: null,
          order: orderWithPaymentInfo,
        };
        this.notificationService.sendNewOrderNotification(
          tenantId,
          orderCreated,
        );

        return orderCreated;
      }
    } catch (error) {
      this.logger.error('Error creando orden:', error);
      throw new InternalServerErrorException('Error creando la orden');
    }
  }
}
