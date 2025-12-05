import { Prisma } from '@prisma/client';

// =================== CART JSON TYPES ===================

export interface CustomerPhone {
  area_code?: string;
  number: string;
}

export interface CustomerAddress {
  street_name?: string;
  street_number?: number;
  zip_code?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CustomerInfo {
  name: string;
  email?: string;
  phone?: CustomerPhone;
  address?: CustomerAddress;
  notes?: string;
  identification?: {
    type?: string; // DNI, CUIT, etc.
    number?: string;
  };
}

export interface CartModifier {
  name: string;
  price_delta: number;
}

export interface CartItem {
  product_id: string;
  variant_id?: string | null;
  name: string;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  modifiers?: CartModifier[];
  image_url?: string | null;
}

export interface CartDiscount {
  code: string;
  amount: number;
}

export interface CartJson {
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  discounts?: CartDiscount[];
  delivery_fee: number;
  tips: number;
  total: number;
  currency: string;
  session_id?: string;
  tenant_id: string;
  version: number;
  created_at?: string;
}

// =================== ORDER TYPES ===================

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type SourceChannel = 'web' | 'whatsapp' | 'instagram' | 'telegram';

export type DeliveryMethod = 'pickup' | 'delivery';

export type PaymentMethod = 'mercadopago' | 'cash_on_delivery';

export interface DeliveryAddress {
  street?: string;
  number?: string;
  floor?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
}

export interface CreateOrderDto {
  tenant_id: string;
  source_channel?: string | null;
  status?: string;
  // Campos de cliente
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  // Campos de entrega
  delivery_method?: DeliveryMethod | null;
  delivery_address?: Prisma.InputJsonValue | null;
  // Campos de pago
  payment_method?: PaymentMethod | null;
  shipping_cost?: Prisma.Decimal | number;
  // Campos existentes
  total_amount: Prisma.Decimal | number;
  currency?: string;
  cart_json?: Prisma.InputJsonValue | null; // Compatible con Prisma Json type
}

export interface UpdateOrderDto {
  status?: string;
  // Campos de cliente
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  // Campos de entrega
  delivery_method?: DeliveryMethod | null;
  delivery_address?: Prisma.InputJsonValue | null;
  // Campos de pago
  payment_method?: PaymentMethod | null;
  shipping_cost?: Prisma.Decimal | number;
  // Campos existentes
  total_amount?: Prisma.Decimal | number;
  cart_json?: Prisma.InputJsonValue | null;
  mp_preference_id?: string | null;
  mp_merchant_order_id?: string | null;
}

export interface OrderItem {
  order_item_id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: Prisma.Decimal;
  discount?: Prisma.Decimal | null;
}

export interface Order {
  order_id: string;
  tenant_id: string;
  source_channel?: string | null;
  status: string;
  // Campos de cliente
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  // Campos de entrega
  delivery_method?: string | null;
  delivery_address?: Prisma.JsonValue | null;
  // Campos de pago
  payment_method?: string | null;
  shipping_cost: Prisma.Decimal;
  // Campos existentes
  total_amount: Prisma.Decimal;
  currency: string;
  cart_json?: Prisma.JsonValue; // Compatible con Prisma Json? type
  mp_preference_id?: string | null;
  mp_merchant_order_id?: string | null;
  created_at: Date;
  order_item?: OrderItem[];
}

export interface OrderWithItems extends Order {
  order_item: OrderItem[];
}

// =================== ORDER QUERY TYPES ===================

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  source_channel?: string;
  from_date?: Date;
  to_date?: Date;
  sort_by?: 'created_at' | 'total_amount' | 'status';
  order?: 'asc' | 'desc';
}

export interface OrderPaginatedResponse {
  data: Order[];
  meta: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
  };
}

// =================== HELPER FUNCTIONS ===================

/**
 * Convierte un CartJson a Prisma.InputJsonValue para guardar en la DB
 */
export function cartJsonToPrisma(cart: CartJson): Prisma.InputJsonValue {
  return cart as unknown as Prisma.InputJsonValue;
}

/**
 * Parsea el cart_json de la DB a CartJson tipado
 * Retorna null si el valor no es válido
 */
export function parseCartJson(value: Prisma.JsonValue): CartJson | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as unknown as CartJson;
}
