import { Injectable, Logger } from '@nestjs/common';

import { DbService, orderRepo } from '@src/libs/db';
import { OrdersFilterDto } from '../dto/orderFilter.dto';

import { StorageService } from '@src/storage/storage.service';
import { NotificationService } from '@src/modules/notifications/public/services/notification.service';

import { ORDER_STATUS } from '@src/constants/app.contants';

//? MODULO DE ORDENES - SERVICIO ADMIN
@Injectable()
export class OrderService {
  constructor(
    private readonly dbService: DbService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly logger = new Logger(OrderService.name + '-Admin');

  // Obtener todas las órdenes
  async getAllOrders(tenantId: string, filters?: OrdersFilterDto) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
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
