package addresses

import "errors"

var (
	ErrAddressIdRequired = errors.New("addressId is required")
	ErrInvalidAddressId  = errors.New("invalid addressId")
	ErrAddressNotFound   = errors.New("address not found")
)
