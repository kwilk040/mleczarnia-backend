package companies

import "errors"

var (
	ErrCompanyIdRequired = errors.New("company id is required")
	ErrInvalidCompanyId  = errors.New("invalid company id")
	ErrCompanyNotFound   = errors.New("company not found")
)
