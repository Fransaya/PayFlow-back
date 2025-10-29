export interface Tenant {
  tenant_id: string;
  name: string;
  slug: string;
  primary_color: string | null;
  secondary_color: string | null;
  custom_domain: string | null;
  plan_status: 'FREE' | 'PAID' | 'TRIAL';
  created_at: Date;
}

export interface TenantCreate {
  name: string;
  slug: string;
}

export interface TenantUpdate {
  name?: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  custom_domain?: string | null;
  currency?: string | null;
}
