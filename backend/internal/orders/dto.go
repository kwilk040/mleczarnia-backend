package orders

import (
	"mleczarnia/internal/db/sqlc"
	"time"
)

type ListOrdersResponse struct {
	Orders []OrderResponse `json:"orders"`
}

type GetOrderItemsResponse struct {
	Items []OrderItemResponse `json:"item"`
}

type CreateOrderRequest struct {
	Items []struct {
		ProductID int32 `json:"productId" validate:"required"`
		Quantity  int32 `json:"quantity" validate:"required,min=1"`
	} `json:"items" validate:"required,min=1,dive"`
}

type UpdateOrderStatusRequest struct {
	Status sqlc.OrderStatus `json:"status" validate:"required,oneof=NEW INVOICED IN_PREPARATION CANCELLED SHIPPED'"`
}

type OrderResponse struct {
	ID          int32            `json:"id"`
	OrderNumber string           `json:"orderNumber"`
	Status      sqlc.OrderStatus `json:"status"`
	TotalAmount string           `json:"totalAmount"`
	OrderDate   time.Time        `json:"orderDate"`
}

type OrderItemResponse struct {
	ID          int32  `json:"id"`
	ProductID   int32  `json:"productId"`
	ProductName string `json:"productName"`
	Quantity    int32  `json:"quantity"`
	UnitPrice   string `json:"unitPrice"`
	LineTotal   string `json:"lineTotal"`
}
