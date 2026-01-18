package addresses

import "mleczania/internal/db/sqlc"

type AddressResponse struct {
	Id         int32            `json:"id"`
	Address    string           `json:"address"`
	City       string           `json:"city"`
	PostalCode string           `json:"postalCode"`
	Country    string           `json:"country"`
	Type       sqlc.AddressType `json:"type"`
}

type CreateAddressRequest struct {
	Address    string           `json:"address" validate:"required,max=255"`
	City       string           `json:"city" validate:"required,max=100"`
	PostalCode string           `json:"postalCode" validate:"required,max=20"`
	Country    string           `json:"country" validate:"required,max=100"`
	Type       sqlc.AddressType `json:"type" validate:"required,oneof=SHIPPING BILLING"`
}

type UpdateAddressRequest struct {
	Address    *string           `json:"address" validate:"max=255"`
	City       *string           `json:"city" validate:"max=100"`
	PostalCode *string           `json:"postalCode" validate:"max=20"`
	Country    *string           `json:"country" validate:"max=100"`
	Type       *sqlc.AddressType `json:"type" validate:"oneof=SHIPPING BILLING"`
}
