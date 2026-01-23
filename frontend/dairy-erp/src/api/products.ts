import { apiRequest } from './client';
import { Product } from '../types';

export interface ListProductsResponse {
  products: Product[];
}

export interface CreateProductRequest {
  name: string;
  category: string;
  unit: string;
  defaultPrice: number;
}

export interface UpdateProductRequest {
  name?: string;
  category?: string;
  unit?: string;
  defaultPrice?: number;
}

// Lista produktów
export async function listProducts(): Promise<Product[]> {
  const response = await apiRequest<ListProductsResponse>('/products');
  return response.products;
}

// Szczegóły produktu
export async function getProduct(productId: number): Promise<Product> {
  return apiRequest<Product>(`/products/${productId}`);
}

// Utwórz produkt
export async function createProduct(request: CreateProductRequest): Promise<Product> {
  return apiRequest<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Aktualizuj produkt
export async function updateProduct(
  productId: number,
  request: UpdateProductRequest
): Promise<Product> {
  return apiRequest<Product>(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

// Aktywuj produkt
export async function activateProduct(productId: number): Promise<void> {
  await apiRequest<void>(`/products/${productId}/activate`, {
    method: 'PATCH',
  });
}

// Deaktywuj produkt
export async function deactivateProduct(productId: number): Promise<void> {
  await apiRequest<void>(`/products/${productId}/deactivate`, {
    method: 'PATCH',
  });
}
