// Objeto enviado a través de WebSocket al Panel Admin
export interface PaymentNotificationPayload {
  tenantId: string;
  orderId: string;
  mappedOrderStatus: string; // 'paid', 'rejected', 'refunded', 'charged_back'

  // Datos de la Transacción
  transactionAmount: number;
  currencyId: string;
  mpPaymentId: number;
  mpStatusDetail: string;

  // Datos del Cliente
  customerEmail: string;
  customerName: string;

  // Otros
  paymentMethod: string;
  dateApproved: string;
}
