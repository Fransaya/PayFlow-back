// Tipos base de auth_account
export interface AuthAccountBase {
  account_id: string;
  user_type: 'OWNER' | 'BUSINESS';
  user_ref: string;
  provider: string | null;
  provider_sub: string | null;
  email: string;
  password_hash?: string; // Agregado para login local
}

// Tipo para los datos del tenant
export interface TenantInfo {
  tenant_id: string;
  name: string;
  slug: string;
}

// Tipo para user_owner con relaciones
export interface UserOwnerDetails {
  user_owner_id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean | null;
  tenants: TenantInfo;
}

// Tipo para user_business con relaciones
export interface UserBusinessDetails {
  user_id: string;
  tenant_id: string;
  email: string;
  name: string;
  status: string | null;
  created_at: Date | null;
  tenants: TenantInfo;
  user_role: any;
}

// Tipo de retorno cuando el usuario es OWNER
export interface UserWithOwnerDetails extends AuthAccountBase {
  user_type: 'OWNER';
  user_details: UserOwnerDetails | null;
}

// Tipo de retorno cuando el usuario es BUSINESS
export interface UserWithBusinessDetails extends AuthAccountBase {
  user_type: 'BUSINESS';
  user_details: UserBusinessDetails | null;
}

// Tipo de retorno genérico de getUserByEmail
export type GetUserByEmailResponse =
  | UserWithOwnerDetails
  | UserWithBusinessDetails
  | AuthAccountBase
  | null;

// =================== TIPOS PARA AUTH CALLBACK ===================

// Información básica del usuario de Google
export interface GoogleUserInfo {
  email: string;
  name?: string;
  picture?: string;
}

// Sesión de la aplicación interna
export interface AppSessionData {
  user_type: 'OWNER' | 'BUSINESS';
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number | string;
  session: any;
}

// Respuesta del callback de autenticación
export interface AuthCallbackResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token: string;
  user: GoogleUserInfo;
  action: 'LOGIN' | 'REGISTER';
  user_exists: boolean;
  message: string;
  redirect_to: '/dashboard' | '/register';
  app_session?: AppSessionData;
}

// Respuesta de sincronización de cuenta
export interface SyncAccountResponse {
  description: string;
  data: {
    existUser: boolean;
    action: 'LOGIN' | 'REGISTER';
  };
}

// Respuesta de login de la aplicación
export interface LoginAppResponse {
  description: string;
  data: AppSessionData;
}
