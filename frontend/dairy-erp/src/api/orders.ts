import { apiRequest } from './client';
import { Order, OrderItem, OrderStatus } from '../types';

export interface CreateOrderRequest {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface ListOrdersResponse {
  orders: Order[];
}

export interface OrderItemsResponse {
  item: OrderItem[];
}

// Lista zamówień
export async function listOrders(): Promise<Order[]> {
  const response = await apiRequest<ListOrdersResponse>('/orders');
  return response.orders;
}

// Szczegóły zamówienia
export async function getOrder(orderId: number): Promise<Order> {
  return apiRequest<Order>(`/orders/${orderId}`);
}

// Pozycje zamówienia
export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  const response = await apiRequest<OrderItemsResponse>(`/orders/${orderId}/items`);
  return response.item;
}

// Utwórz zamówienie
export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  return apiRequest<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Zmień status zamówienia
export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<void> {
  await apiRequest<void>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
