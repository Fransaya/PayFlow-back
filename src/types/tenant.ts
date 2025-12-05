import { Prisma } from '@prisma/client';

export interface Tenant {
  tenant_id: string;
  name: string;
  slug: string;
  primary_color: string | null;
  secondary_color: string | null;
  custom_domain: string | null;
  currency: string | null;
  plan_status: 'FREE' | 'PAID' | 'TRIAL' | string;
  allow_cash_on_delivery: boolean | null;
  created_at: Date;
}

export interface TenantCreate {
  name: string;
  slug: string;
  allow_cash_on_delivery?: boolean;
}

export interface TenantUpdate {
  name?: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  custom_domain?: string | null;
  allow_cash_on_delivery?: boolean | null;
}

// =================== DELIVERY CONFIG TYPES ===================

export type DeliveryConfigType = 'pickup' | 'delivery';

export interface DeliveryConfigSettings {
  // Configuraciones para tarifas por zona
  zones?: {
    name: string;
    rate: number;
    zip_codes?: string[];
  }[];
  // Radio máximo de entrega en km
  max_radius_km?: number;
  // Tarifa mínima de pedido para envío gratis
  free_shipping_min_amount?: number;
  // Tiempo estimado de entrega (minutos)
  estimated_time_min?: number;
  estimated_time_max?: number;
}

export interface DeliveryConfig {
  delivery_config_id: string;
  tenant_id: string;
  is_active: boolean;
  type: DeliveryConfigType;
  name: string | null;
  description: string | null;
  base_rate: Prisma.Decimal;
  settings_json: DeliveryConfigSettings | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDeliveryConfigDto {
  tenant_id: string;
  is_active?: boolean;
  type: DeliveryConfigType;
  name?: string | null;
  description?: string | null;
  base_rate?: Prisma.Decimal | number;
  settings_json?: Prisma.InputJsonValue | null;
}

export interface UpdateDeliveryConfigDto {
  is_active?: boolean;
  name?: string | null;
  description?: string | null;
  base_rate?: Prisma.Decimal | number;
  settings_json?: Prisma.InputJsonValue | null;
}
