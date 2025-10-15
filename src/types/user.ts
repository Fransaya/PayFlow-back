// Tipos base de auth_account
export interface AuthAccountBase {
  account_id: string;
  user_type: 'OWNER' | 'BUSINESS';
  user_ref: string;
  provider: string | null;
  provider_sub: string | null;
  email: string;
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
