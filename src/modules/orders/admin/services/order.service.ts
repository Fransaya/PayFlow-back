import { Injectable, Logger } from '@nestjs/common';

import { DbService, orderRepo, tenantRepo } from '@src/libs/db';
import { OrdersFilterDto } from '../dto/orderFilter.dto';

import { StorageService } from '@src/storage/storage.service';
import { NotificationService } from '@src/modules/notifications/public/services/notification.service';
import {
  WhatsAppServide,
  translateOrderStatus,
  formatCurrency,
  getShortOrderId,
} from '@src/messaging/services/whatsapp.service';

import { ORDER_STATUS } from '@src/constants/app.contants';

//? MODULO DE ORDENES - SERVICIO ADMIN
@Injectable()
export class OrderService {
  constructor(
    private readonly dbService: DbService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationService,
    private readonly whatsappService: WhatsAppServide,
  ) {}

  private readonly logger = new Logger(OrderService.name + '-Admin');

  // Obtener todas las órdenes
  async getAllOrders(tenantId: string, filters?: OrdersFilterDto) {
    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return orderRepo(tx).getAllOrders(filters);
    });
  }

  // Obtener orden por ID (mismo formato que getAllOrders)
  async getOrderById(tenantId: string, orderId: string) {
    const order = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        return orderRepo(tx).getOrderById(orderId);
      },
    );

    if (!order) {
      this.logger.warn(
        `Order with ID ${orderId} not found for tenant ${tenantId}`,
      );
      return null;
    }

    return order;
  }

  // Obtener orden por ID con detalles completos (producto y variante)
  async getOrderDetailsById(tenantId: string, orderId: string) {
    const orderDetails = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        return orderRepo(tx).getOrderDetails(orderId);
      },
    );

    if (!orderDetails) {
      this.logger.warn(
        `Order with ID ${orderId} not found for tenant ${tenantId}`,
      );
      return null;
    }

    // Procesar las URLs de imágenes en paralelo
    if (orderDetails.order_item?.length) {
      const itemsWithImages = await Promise.all(
        orderDetails.order_item.map(async (item) => {
          // Imagen del producto
          const productImageUrl = item.product?.image_url
            ? await this.storageService.getPresignedGetUrl(
                item.product.image_url,
              )
            : null;

          return {
            ...item,
            product: {
              ...item.product,
              image_url: productImageUrl,
            },
          };
        }),
      );

      return {
        ...orderDetails,
        order_item: itemsWithImages,
      };
    }

    return orderDetails;
  }

  // Actualizar estado de la orden
  async updateOrderStatus(tenantId: string, orderId: string, status: string) {
    console.log('datos recibidos en service:', { tenantId, orderId, status });

    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new Error('Invalid order status');
    }

    if (!tenantId || !orderId) {
      throw new Error('Tenant ID and Order ID are required');
    }

    const infoTenant = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        return tenantRepo(tx).getTenantById(tenantId);
      },
    );

    if (!infoTenant) {
      throw new Error('Tenant not found');
    }

    const orderInfo = await this.dbService.runInTransaction(
      {
        tenantId,
      },
      async (tx) => {
        return orderRepo(tx).getOrderById(orderId);
      },
    );

    if (!orderInfo) {
      throw new Error('Order not found');
    }

    if (orderInfo.customer_phone !== null) {
      // Enviar notificación por WhatsApp al cliente sobre el cambio de estado
      // Template: order_status_update requiere 5 parámetros: nombre_cliente, order_id, nombre_negocio, estado, total
      void this.whatsappService.sendTemplateMessage(
        orderInfo.customer_phone,
        'order_status_update',
        [
          orderInfo.customer_name || 'Cliente', // {{1}} - Nombre del cliente
          getShortOrderId(orderId), // {{2}} - Order ID (últimos 8 caracteres)
          infoTenant.name, // {{3}} - Nombre del negocio
          translateOrderStatus(status), // {{4}} - Estado traducido al español
          formatCurrency(Number(orderInfo.total_amount)), // {{5}} - Total formateado (ej: $30.000)
        ],
        infoTenant.slug,
        orderId,
      );
    }

    this.notificationService.updateOrderStatusNotificationPublic(
      tenantId,
      orderId,
      status,
    );

    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return orderRepo(tx).updateOrderStatus(orderId, status);
    });
  }

  // Listar órdenes por estado
  async listOrdersByStatus(tenantId: string, status: string) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return orderRepo(tx).findByStatus(status);
    });
  }

  // Eliminar orden
  async deleteOrder(tenantId: string, orderId: string) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return orderRepo(tx).delete(orderId);
    });
  }
}
