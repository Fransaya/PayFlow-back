export const USER_TYPE = {
  OWNER: 'OWNER',
  BUSINESS: 'BUSINESS',
};

export const PROVIDER = {
  AUTH0: 'AUTH0',
  GOOGLE: 'GOOGLE',
  LOCAL: 'LOCAL',
};

export const USERS_BUSINESS_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
};

export const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  ACCEPTED: 'ACCEPTED',
  IN_PREPARATION: 'IN_PREPARATION',
  READY: 'READY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
  REFUNDED: 'REFUNDED',
  CHARGED_BACK: 'CHARGED_BACK',
};

export const PAYMENTS_STATUS = {
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  REJECTED: 'REJECTED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  CHARGED_BACK: 'CHARGED_BACK',
};

export const PAYMENTS_STATUS_MERCADO_PAGO: Record<string, string> = {
  approved: 'APPROVED',
  pending: 'IN_PROGRESS',
  in_process: 'IN_PROGRESS',
  rejected: 'REJECTED',
  cancelled: 'CANCELLED',
  refunded: 'REFUNDED',
  charged_back: 'CHARGED_BACK',
};

export const EMAIL_CONTRAINTS_ACCEPTED = {
  privacidad: 'legal@pedilo.ap',
  beta: 'beta@pedilo.app',
  soporte: 'soporte@pedilo.app',
};
