/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Prisma } from '@prisma/client';
import { OrdersFilterDto } from '@src/modules/orders/admin/dto/orderFilter.dto';

import { cartJsonToPrisma } from '@src/types/order';

// Helper: Construir filtro de fechas
function buildDateFilter(fromDate?: string, toDate?: string) {
  if (!fromDate && !toDate) return {};

  return {
    created_at: {
      ...(fromDate && { gte: new Date(fromDate) }),
      ...(toDate && { lte: new Date(toDate) }),
    },
  };
}

function buildRangeDateFilter(dateRange?: string) {
  const now = new Date();

  switch (dateRange) {
    case 'today':
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      return { created_at: { gte: startOfToday } };
    case 'yesterday':
      const startOfYesterday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
      );
      return { created_at: { gte: startOfYesterday } };
    case 'last_7_days':
      const startOfLast7Days = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7,
      );
      return { created_at: { gte: startOfLast7Days } };
    case 'last_30_days':
      const startOfLast30Days = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 30,
      );
      return { created_at: { gte: startOfLast30Days } };
    case 'this_month':
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { created_at: { gte: startOfThisMonth } };
    case 'last_month':
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      return { created_at: { gte: startOfLastMonth } };
    case 'this_year':
      const startOfThisYear = new Date(now.getFullYear(), 0, 1);
      return { created_at: { gte: startOfThisYear } };
    case 'last_year':
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      return { created_at: { gte: startOfLastYear } };
    default:
      return {};
  }
}

// Helper: Construir filtro de montos
function buildAmountFilter(minAmount?: number, maxAmount?: number) {
  if (minAmount === undefined && maxAmount === undefined) return {};

  return {
    total_amount: {
      ...(minAmount !== undefined && { gte: minAmount }),
      ...(maxAmount !== undefined && { lte: maxAmount }),
    },
  };
}

export function orderRepo(tx: Prisma.TransactionClient) {
  return {
    // Metodo para obtener todas las ordenes con filtros opcionales
    async getAllOrders(tenantId: string, filters?: OrdersFilterDto) {
      if (!tenantId) {
        throw new Error('Tenant ID is required to fetch orders.');
      }

      // Construir filtros dinámicamente
      const where: Prisma.orderWhereInput = {
        tenant_id: tenantId, // Asegurar que el filtro de tenant_id siempre se aplique
        ...(filters?.status && { status: filters.status }),
        ...(filters?.source_channel && {
          source_channel: filters.source_channel,
        }),
        ...buildDateFilter(filters?.from_date, filters?.to_date),
        ...buildAmountFilter(filters?.min_amount, filters?.max_amount),
        ...buildRangeDateFilter(filters?.date_range),
      };

      // Paginación con valores por defecto
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 10;
      const skip = (page - 1) * limit;

      // Ordenamiento dinámico
      const sortBy = filters?.sort_by ?? 'created_at';
      const sortOrder = filters?.sort_order ?? 'desc';

      // Estados que generan ingresos reales
      const validRevenueStatuses = [
        'PAID',
        'ACCEPTED',
        'IN_PREPARATION',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ];

      const [orders, total, summary] = await Promise.all([
        tx.order.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: {
            order_item: true,
          },
        }),
        tx.order.count({ where }),
        // Calcular totales solo de pedidos válidos
        tx.order.aggregate({
          where: {
            ...where,
            status: { in: validRevenueStatuses },
          },
          _sum: {
            total_amount: true,
            shipping_cost: true,
          },
          _count: true,
          _avg: {
            total_amount: true,
          },
        }),
      ]);

      return {
        data: orders,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        summary: {
          totalRevenue: Number(summary._sum.total_amount || 0),
          totalShippingCost: Number(summary._sum.shipping_cost || 0),
          validOrdersCount: summary._count,
          averageTicket: Number(summary._avg.total_amount || 0),
        },
      };
    },

    // Metodo para obtener orden por ID (mismo formato que getAllOrders)
    async getOrderById(order_id: string) {
      return tx.order.findUnique({
        where: {
          order_id,
        },
        include: {
          order_item: true,
        },
      });
    },

    // Metodo para obtener order y detalle de orden por ID (con producto y variante)
    async getOrderDetails(order_id: string) {
      return tx.order.findUnique({
        where: {
          order_id,
        },
        include: {
          order_item: {
            include: {
              product: true,
            },
          },
        },
      });
    },

    // Metodo para obtener estado de orden por ID
    async getOrderStatus(order_id: string) {
      return tx.order.findUnique({
        where: {
          order_id,
        },
        select: {
          status: true,
          created_at: true,
        },
      });
    },

    // Metodo para crear orden - base
    async createOrder(data: {
      tenant_id: string;
      source_channel: string;
      status: string;
      // Campos de cliente
      customer_name?: string | null;
      customer_phone?: string | null;
      customer_email?: string | null;
      // Campos de entrega
      delivery_method?: string | null;
      delivery_address?: any | null;

      // Nota adicional
      aditional_note?: string | null;

      // Campos de pago
      payment_method?: string | null;
      shipping_cost?: number;
      // Campos existentes
      total_amount: number;
      currency: string;
      cart_json?: any;
      mp_preference_id?: string | null;
      mp_merchant_order_id?: string | null;
    }) {
      return tx.order.create({
        data: {
          tenant_id: data.tenant_id,
          source_channel: data.source_channel,
          status: data.status,
          // Campos de cliente
          customer_name: data.customer_name || null,
          customer_phone: data.customer_phone || null,
          customer_email: data.customer_email || null,
          // Campos de entrega
          delivery_method: data.delivery_method || null,
          delivery_address: data.delivery_address || null,
          // Nota adicional
          aditional_note: data.aditional_note || null,

          // Campos de pago
          payment_method: data.payment_method || null,
          shipping_cost: data.shipping_cost ?? 0,
          // Campos existentes
          total_amount: data.total_amount,
          currency: data.currency,
          cart_json: data.cart_json
            ? cartJsonToPrisma(data.cart_json)
            : undefined,
          mp_preference_id: data.mp_preference_id || null,
          mp_merchant_order_id: data.mp_merchant_order_id || null,
        },
      });
    },

    // Metodo para crear detalle de orden
    async createOrderItem(data: {
      order_id: string;
      product_id: string;
      quantity: number;
      unit_price: number;
      discount: number | null;
      selected_variants?: any[] | null; // JSON array con las variantes
    }) {
      return tx.order_item.create({
        data: {
          order_id: data.order_id,
          product_id: data.product_id,
          quantity: data.quantity,
          unit_price: data.unit_price,
          discount: data.discount || null,
          selected_variants: data.selected_variants || null,
        } as any, // Type assertion necesario hasta que Prisma Client se actualice
      });
    },

    // Metodo para actualizar el estado de una orden
    async updateOrderStatus(order_id: string, status: string) {
      return tx.order.update({
        where: {
          order_id,
        },
        data: {
          status,
        },
      });
    },

    // Metodo para actualizar una orden completa
    async updateOrder(
      order_id: string,
      data: {
        status?: string;
        customer_name?: string | null;
        customer_phone?: string | null;
        customer_email?: string | null;
        delivery_method?: string | null;
        delivery_address?: any | null;
        payment_method?: string | null;
        shipping_cost?: number;
        total_amount?: number;
        cart_json?: any;
        mp_preference_id?: string | null;
        mp_merchant_order_id?: string | null;
      },
    ) {
      return tx.order.update({
        where: {
          order_id,
        },
        data: {
          ...(data.status !== undefined && { status: data.status }),
          ...(data.customer_name !== undefined && {
            customer_name: data.customer_name,
          }),
          ...(data.customer_phone !== undefined && {
            customer_phone: data.customer_phone,
          }),
          ...(data.customer_email !== undefined && {
            customer_email: data.customer_email,
          }),
          ...(data.delivery_method !== undefined && {
            delivery_method: data.delivery_method,
          }),
          ...(data.delivery_address !== undefined && {
            delivery_address:
              data.delivery_address === null
                ? Prisma.JsonNull
                : data.delivery_address,
          }),
          ...(data.payment_method !== undefined && {
            payment_method: data.payment_method,
          }),
          ...(data.shipping_cost !== undefined && {
            shipping_cost: data.shipping_cost,
          }),
          ...(data.total_amount !== undefined && {
            total_amount: data.total_amount,
          }),
          ...(data.cart_json !== undefined && {
            cart_json: data.cart_json
              ? cartJsonToPrisma(data.cart_json)
              : Prisma.JsonNull,
          }),
          ...(data.mp_preference_id !== undefined && {
            mp_preference_id: data.mp_preference_id,
          }),
          ...(data.mp_merchant_order_id !== undefined && {
            mp_merchant_order_id: data.mp_merchant_order_id,
          }),
        },
      });
    },

    // Metodo para actualizar los datos de una orden con datos de preferencia creada en Mercado Pago
    async updateOrderPaymentInfo(
      order_id: string,
      mpData: {
        mp_preference_id?: string;
        mp_merchant_order_id?: string;
      },
    ) {
      return tx.order.update({
        where: {
          order_id,
        },
        data: {
          mp_preference_id: mpData.mp_preference_id,
          mp_merchant_order_id: mpData.mp_merchant_order_id,
        },
      });
    },

    // Metodo para buscar ordenes por estado
    async findByStatus(status: string) {
      return tx.order.findMany({
        where: {
          status,
        },
      });
    },

    // Metodo para eliminar orden por id ( cambio a estado finalizado - soft delete)
    async delete(order_id: string) {
      return tx.order.update({
        where: {
          order_id,
        },
        data: {
          status: 'cancelled',
        },
      });
    },

    // Metodos de repositorio publico para obtener informacion de ordenes desde carrito publico por tenant
    async getPublicOrderById(order_id: string, tenant_id: string) {
      return tx.order.findFirst({
        where: {
          order_id,
          tenant_id,
        },
        include: {
          order_item: true,
        },
      });
    },
  };
}
