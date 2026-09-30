import { API_URL } from './apollo';
import type { Product, ProductsResponse } from '../types/product';

export class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = localStorage.getItem('token');
  const r = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!r.ok) throw new HttpError(r.status);
  return r.json();
}

export const fetchProducts = (page: number, q: string, pageSize = 12, signal?: AbortSignal) =>
  request<ProductsResponse>(
    `/api/products?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`,
    signal
  );
export const fetchProduct = (id: string) =>
  request<Product>(`/api/products/${encodeURIComponent(id)}`);