package products

import "errors"

var (
	ErrProductIdRequired      = errors.New("product id is required")
	ErrInvalidProductId       = errors.New("invalid product id")
	ErrProductNotFound        = errors.New("product not found")
	ErrFailedToParseDecimal   = errors.New("failed to parse default price")
	ErrFailedToConvertDecimal = errors.New("failed to convert default price")
)
