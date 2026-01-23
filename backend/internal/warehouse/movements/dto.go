package movements

import (
	"mleczarnia/internal/db/sqlc"
	"time"
)

type StockMovement struct {
	Id             int32             `json:"id"`
	ProductId      int32             `json:"productId"`
	QuantityChange int32             `json:"quantityChange"`
	MovementType   sqlc.MovementType `json:"movementType"`
	RelatedOrderId *int32            `json:"relatedOrderId,omitempty"`
	Reason         *string           `json:"reason,omitempty"`
	CreatedAt      time.Time         `json:"createdAt"`
	EmployeeId     *int32            `json:"employeeId,omitempty"`
}

type ListStockMovementResponse struct {
	StockMovements []StockMovement `json:"stockMovements"`
}

type InboundRequest struct {
	ProductId int32  `json:"productId" validate:"required"`
	Quantity  int32  `json:"quantity" validate:"required,gt=0"`
	Reason    string `json:"reason"`
}

type DispatchRequest struct {
	ProductId int32 `json:"productId" validate:"required"`
	Quantity  int32 `json:"quantity" validate:"required,gt=0"`
	//TODO: Should it be connected to order?
	//OrderId   int32  `json:"orderId" validate:"required,gt=0"`
	Reason string `json:"reason"`
}

type ReturnRequest struct {
	ProductId int32  `json:"productId" validate:"required"`
	Quantity  int32  `json:"quantity" validate:"required,gt=0"`
	OrderId   int32  `json:"orderId" validate:"required"`
	Reason    string `json:"reason"`
}

type LossRequest struct {
	ProductId int32  `json:"productId" validate:"required"`
	Quantity  int32  `json:"quantity" validate:"required,gt=0"`
	Reason    string `json:"reason"`
}
