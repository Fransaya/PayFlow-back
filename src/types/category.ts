export interface Category {
  category_id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  active: boolean | null;
  image_key: string | null;
}
