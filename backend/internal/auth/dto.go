package auth

import "mleczarnia/internal/db/sqlc"

type TokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type Address struct {
	Address    string           `json:"address" validate:"required,max=255"`
	City       string           `json:"city" validate:"required,max=100"`
	PostalCode string           `json:"postalCode" validate:"required,max=20"`
	Country    string           `json:"country" validate:"required,max=100"`
	Type       sqlc.AddressType `json:"type" validate:"required,oneof=SHIPPING BILLING"`
}

type RegisterCompanyRequest struct {
	Name        string    `json:"name" validate:"required,max=200"`
	TaxId       string    `json:"taxId" validate:"required,max=20"`
	MainEmail   string    `json:"mainEmail" validate:"required,email"`
	PhoneNumber *string   `json:"phoneNumber" validate:"e164"`
	Addresses   []Address `json:"addresses" validate:"required,min=1,dive"`
	Email       string    `json:"email" validate:"required,email"`
	Password    string    `json:"password" validate:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" validate:"required"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refreshToken" validate:"required"`
}
