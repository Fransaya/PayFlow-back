export interface Product {
  product_id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  stock: number | null;
  image_url: string | null;
  visible: boolean | null;
  created_at: Date | null;
}
