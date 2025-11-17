export interface UserFromJWT {
  user_id: string;
  tenant_id: string;
  email: string;
  provider: string;
  iat: number;
  exp: number;
  roles?: string[];
}
