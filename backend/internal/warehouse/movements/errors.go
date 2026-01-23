package movements

import "errors"

var (
	ErrInsufficientStock = errors.New("insufficient stock")
	ErrMovementNotFound  = errors.New("movement not found")
)
