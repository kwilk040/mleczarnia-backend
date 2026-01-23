package invoices

import "errors"

var (
	ErrInvoiceNotFound             = errors.New("invoice not found")
	ErrInvoiceAlreadyExists        = errors.New("invoice already exists for order")
	ErrInvoiceForbidden            = errors.New("forbidden")
	ErrFailedToCreateDecimal       = errors.New("internal server error")
	ErrInvalidStatusChange         = errors.New("invalid status change")
	ErrFailedToGetCompanyIdForUser = errors.New("failed to get company id")
	ErrInvoiceIdRequired           = errors.New("invoice id required")
	ErrInvalidInvoiceId            = errors.New("invalid invoice id")
	ErrOrderIdRequired             = errors.New("order id required")
	ErrInvalidOrderId              = errors.New("invalid order id")
)
