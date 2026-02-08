export type Product = {
  id: number;
  name: string;
  wholesale_package: string;
  retail_package: string;
  manufacturer: string | null;
  barcode: string | null;
  purchase_price: number;
  retail_purchase_price: number;
  wholesale_price: number;
  retail_price: number;
  discount_amount: number;
  is_active: boolean;
};
