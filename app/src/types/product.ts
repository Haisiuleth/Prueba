export interface Product {
  productId: string;
  brand: string;
  productTitle: string;
  items: string[];
  image: string;
  description: string;
  link: string;
  categories: string[];
  price: number;
  listPrice?: number
}

export interface ProductsResponse {
  page: number;
  pageSize: number;
  total: number;
  data: Product[];
  listPrice?: number
}