package orders

import "errors"

var (
	ErrInvalidStatusTransition = errors.New("invalid order status transition")
	ErrOrderNotFound           = errors.New("order not found")
	ErrCouldNotCreateOrder     = errors.New("could not create order")
	ErrOrderForbidden          = errors.New("forbidden")
	ErrOrderIdRequired         = errors.New("order id required")
	ErrInvalidOrderId          = errors.New("invalid order id")
)
