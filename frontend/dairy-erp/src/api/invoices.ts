import { apiRequest } from './client';
import { Invoice, InvoiceStatus } from '../types';

export interface ListInvoicesResponse {
  invoices: Invoice[];
}

export interface UpdateInvoiceStatusRequest {
  status: InvoiceStatus;
}

// Lista faktur
export async function listInvoices(): Promise<Invoice[]> {
  const response = await apiRequest<ListInvoicesResponse>('/invoices');
  return response.invoices;
}

// Szczegóły faktury
export async function getInvoice(invoiceId: number): Promise<Invoice> {
  return apiRequest<Invoice>(`/invoices/${invoiceId}`);
}

// Pobierz PDF faktury
export async function getInvoicePdf(invoiceId: number): Promise<Blob> {
  const token = localStorage.getItem('auth_tokens');
  const parsed = token ? JSON.parse(token) : null;
  const accessToken = parsed?.accessToken;

  const response = await fetch(`/api/v1/invoices/${invoiceId}/pdf`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch invoice PDF');
  }

  return response.blob();
}

// Zmień status faktury
export async function updateInvoiceStatus(
  invoiceId: number,
  status: InvoiceStatus
): Promise<void> {
  await apiRequest<void>(`/invoices/${invoiceId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Utwórz fakturę dla zamówienia
export async function createInvoiceForOrder(orderId: number): Promise<Invoice> {
  return apiRequest<Invoice>(`/orders/${orderId}/invoices`, {
    method: 'POST',
  });
}
