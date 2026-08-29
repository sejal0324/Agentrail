export interface Product {
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  floorPrice: number;
  compatibleWith?: string[];
  relatedProducts?: string[];
}

export type Catalog = Product[];

export interface PublicProduct {
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  compatibleWith?: string[];
  relatedProducts?: string[];
}
