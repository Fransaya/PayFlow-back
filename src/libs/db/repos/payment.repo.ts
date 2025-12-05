import { Prisma } from '@prisma/client';

export function paymentRepo(tx: Prisma.TransactionClient) {
  return {
    // Metodo para obtener pago por order_id
    async getPaymentByOrderId(order_id: string) {
      return tx.payment.findFirst({
        where: {
          order_id,
        },
      });
    },

    // Metodo para obtener pago por tenant_id y order_id
    async getPaymentByTenantAndPaymentId(tenant_id: string, order_id: string) {
      return tx.payment.findFirst({
        where: {
          tenant_id,
          order_id,
        },
      });
    },

    // Metodo para obtener pago por payment_id
    async getPaymentByPaymentId(payment_id: string) {
      return tx.payment.findUnique({
        where: {
          payment_id,
        },
      });
    },

    // Metodo para crear pago
    async createPayment(data: {
      tenant_id: string;
      order_id: string;
      mp_payment_id?: string | null;
      status: string;
      method?: string | null;
      amount: number;
      currency: string;
      raw_json: any;
    }) {
      return tx.payment.create({
        data: {
          tenant_id: data.tenant_id,
          order_id: data.order_id,
          mp_payment_id: data.mp_payment_id || null,
          status: data.status,
          method: data.method || null,
          amount: data.amount,
          currency: data.currency,
          raw_json: data.raw_json,
        },
      });
    },

    // Metodo para actualizar estado de pago
    async updatePaymentStatus(payment_id: string, status: string) {
      return tx.payment.update({
        where: {
          payment_id,
        },
        data: {
          status,
        },
      });
    },

    // Metodo para actualizar estado de pago por order_id y tenant_id
    async updatePaymentStatusByOrderId(
      tenant_id: string,
      order_id: string,
      status: string,
    ) {
      return tx.payment.updateMany({
        where: {
          tenant_id,
          order_id,
        },
        data: {
          status,
        },
      });
    },
  };
}
