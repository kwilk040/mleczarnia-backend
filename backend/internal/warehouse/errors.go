package warehouse

import "errors"

var (
	ErrStockNotFound     = errors.New("stock not found")
	ErrProductIdRequired = errors.New("productId required")
	ErrInvalidProductId  = errors.New("invalid productId")
)
