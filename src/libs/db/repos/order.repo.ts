import { Prisma } from '@prisma/client';

import { CartJson, cartJsonToPrisma } from '@src/types/order';

export function orderRepo(tx: Prisma.TransactionClient) {
  return {
    // Metodo para obtener order y detalle de orden por ID
    async getOrderDetails(order_id: string) {
      return tx.order.findUnique({
        where: {
          order_id,
        },
        include: {
          order_item: true,
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
      total_amount: number;
      currency: string;
      cart_json?: CartJson;
      mp_preference_id?: string | null;
      mp_merchant_order_id?: string | null;
    }) {
      return tx.order.create({
        data: {
          tenant_id: data.tenant_id,
          source_channel: data.source_channel,
          status: data.status,
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
      variant_id: string | null;
      quantity: number;
      unit_price: number;
      discount: number | null;
    }) {
      return tx.order_item.create({
        data: {
          order_id: data.order_id,
          product_id: data.product_id,
          variant_id: data.variant_id,
          quantity: data.quantity,
          unit_price: data.unit_price,
          discount: data.discount || null,
        },
      });
    },
  };
}
