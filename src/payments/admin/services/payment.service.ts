import { Injectable } from '@nestjs/common';

import { DbService, paymentRepo } from '@src/libs/db';

@Injectable()
export class PaymentService {
  constructor(private readonly dbService: DbService) {}

  // Obtener pago por ID
  async getPaymentById(tenantId: string, paymentId: string) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return paymentRepo(tx).getPaymentByPaymentId(paymentId);
    });
  }

  // Obtener pago por tenantId y orderId
  async getPaymentByTenantAndOrderId(tenantId: string, orderId: string) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return paymentRepo(tx).getPaymentByTenantAndPaymentId(tenantId, orderId);
    });
  }

  // Obtener pago por orderId
  async getPaymentByOrderId(tenantId: string, orderId: string) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return paymentRepo(tx).getPaymentByOrderId(orderId);
    });
  }

  // Crear pago
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
    return this.dbService.runInTransaction(
      { tenantId: data.tenant_id },
      async (tx) => {
        return paymentRepo(tx).createPayment(data);
      },
    );
  }

  // Actualizar estado del pago
  async updatePaymentStatus(
    tenantId: string,
    paymentId: string,
    status: string,
  ) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return paymentRepo(tx).updatePaymentStatus(paymentId, status);
    });
  }

  // Actualiza estado de pago por id de orden y tenant
  async updatePaymentStatusByOrderId(
    tenantId: string,
    orderId: string,
    status: string,
  ) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return paymentRepo(tx).updatePaymentStatusByOrderId(
        tenantId,
        orderId,
        status,
      );
    });
  }
}
