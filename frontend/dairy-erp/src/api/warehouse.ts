import { apiRequest } from './client';
import { Stock, StockMovement, MovementType } from '../types';

export interface UpdateStockRequest {
  quantity?: number;
  minQuantity?: number;
}

export interface CreateStockMovementRequest {
  productId: number;
  quantityChange: number;
  movementType: MovementType;
  relatedOrderId?: number | null;
  reason?: string | null;
}

export interface ListMovementsResponse {
  movements: StockMovement[];
}

// Backend Stock response type
interface BackendStock {
  productId: number;
  productName: string;
  quantity: number;
  minQuantity: number;
  isLow: boolean;
  damagedCount: number;
  returnedCount: number;
}

// Map backend Stock to frontend Stock
function mapBackendStockToStock(backend: BackendStock): Stock {
  return {
    id: backend.productId, // Use productId as id for now
    productId: backend.productId,
    quantity: backend.quantity,
    minQuantity: backend.minQuantity,
    damagedQuantity: backend.damagedCount,
    returnedQuantity: backend.returnedCount,
  };
}

// Lista stanów magazynowych
export async function listStock(): Promise<Stock[]> {
  const response = await apiRequest<{ stocks: BackendStock[] }>('/warehouse');
  return (response.stocks || []).map(mapBackendStockToStock);
}

// Stan magazynowy produktu
export async function getStockByProductId(productId: number): Promise<Stock> {
  return apiRequest<Stock>(`/warehouse/${productId}`);
}

// Aktualizuj stan magazynowy
export async function updateStock(
  productId: number,
  request: UpdateStockRequest
): Promise<void> {
  await apiRequest<void>(`/warehouse/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

// Lista ruchów magazynowych
export async function listStockMovements(): Promise<StockMovement[]> {
  const response = await apiRequest<ListMovementsResponse>('/warehouse/movements');
  return response.movements || [];
}

// Backend request types for movements
export interface InboundRequest {
  productId: number;
  quantity: number;
  reason: string;
}

export interface DispatchRequest {
  productId: number;
  quantity: number;
  reason: string;
}

export interface ReturnRequest {
  productId: number;
  quantity: number;
  orderId: number;
  reason: string;
}

export interface LossRequest {
  productId: number;
  quantity: number;
  reason: string;
}

// Utwórz ruch magazynowy - przyjęcie
export async function createInboundMovement(
  request: InboundRequest
): Promise<StockMovement> {
  return apiRequest<StockMovement>('/warehouse/movements/inbound', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Utwórz ruch magazynowy - wydanie
export async function createDispatchMovement(
  request: DispatchRequest
): Promise<StockMovement> {
  return apiRequest<StockMovement>('/warehouse/movements/dispatch', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Utwórz ruch magazynowy - zwrot
export async function createReturnMovement(
  request: ReturnRequest
): Promise<StockMovement> {
  return apiRequest<StockMovement>('/warehouse/movements/return', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Utwórz ruch magazynowy - strata
export async function createLossMovement(
  request: LossRequest
): Promise<StockMovement> {
  return apiRequest<StockMovement>('/warehouse/movements/loss', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Utwórz ruch magazynowy (legacy - używa odpowiedniego endpointu na podstawie typu)
export async function createStockMovement(
  request: CreateStockMovementRequest
): Promise<StockMovement> {
  const quantity = Math.abs(request.quantityChange);
  const isPositive = request.quantityChange > 0;
  
  switch (request.movementType) {
    case 'INBOUND':
      return createInboundMovement({
        productId: request.productId,
        quantity,
        reason: request.reason || '',
      });
    case 'DISPATCH':
      return createDispatchMovement({
        productId: request.productId,
        quantity,
        reason: request.reason || '',
      });
    case 'RETURN':
      if (!request.relatedOrderId) {
        throw new Error('Order ID is required for return movements');
      }
      return createReturnMovement({
        productId: request.productId,
        quantity,
        orderId: request.relatedOrderId,
        reason: request.reason || '',
      });
    case 'LOSS':
      return createLossMovement({
        productId: request.productId,
        quantity,
        reason: request.reason || '',
      });
    case 'ADJUSTMENT':
      // ADJUSTMENT: jeśli dodatnia ilość -> INBOUND, jeśli ujemna -> DISPATCH
      if (isPositive) {
        return createInboundMovement({
          productId: request.productId,
          quantity,
          reason: request.reason || 'Korekta stanu',
        });
      } else {
        return createDispatchMovement({
          productId: request.productId,
          quantity,
          reason: request.reason || 'Korekta stanu',
        });
      }
    default:
      throw new Error(`Unsupported movement type: ${request.movementType}`);
  }
}
