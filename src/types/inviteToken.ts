export interface InviteToken {
  tenant_id: string;
  role_id: string;
  expires_at: number; // Unix timestamp es más estándar
  email_asociated: string;
  status: string;
  iat?: number; // issued at
  exp?: number; // expiration (estándar JWT)
}
