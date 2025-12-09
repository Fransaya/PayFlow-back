// Define la estructura de los tokens recibidos y almacenados
export interface MpOAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number; // segundos
  scope: string;
  user_id: string; // Este es el collector_id del negocio
}

export interface MpConfigStore {
  mpUserId: string;
  tenantId: string;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  tokenExpiry: Date;
  maxIntallments: number;
  excludedPaymentsTypes: any;
}
