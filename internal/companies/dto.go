package companies

import (
	"mleczarnia/internal/db/sqlc"
	"time"

	"github.com/shopspring/decimal"
)

type Address struct {
	Address    string           `json:"address"`
	City       string           `json:"city"`
	PostalCode string           `json:"postalCode"`
	Country    string           `json:"country"`
	Type       sqlc.AddressType `json:"type"`
}

type CompanyWithDetails struct {
	Name             string             `json:"name"`
	TaxId            string             `json:"taxId"`
	Email            string             `json:"email"`
	PhoneNumber      *string            `json:"phoneNumber"`
	Addresses        []Address          `json:"addresses"`
	Status           sqlc.CompanyStatus `json:"status"`
	OrderCount       int64              `json:"orderCount"`
	RegistrationDate time.Time          `json:"registrationDate"`
	TotalOrdersValue decimal.Decimal    `json:"totalOrdersValue"`
	CompletedOrders  int64              `json:"completedOrders"`
}

type Company struct {
	Id               int32              `json:"id"`
	Name             string             `json:"name"`
	TaxId            string             `json:"taxId"`
	Email            string             `json:"email"`
	PhoneNumber      *string            `json:"phoneNumber"`
	OrderCount       int64              `json:"orderCount"`
	Status           sqlc.CompanyStatus `json:"status"`
	RegistrationDate time.Time          `json:"registrationDate"`
}

type ListCompaniesResponse struct {
	Companies []Company `json:"companies"`
}

type UpdateCompanyRequest struct {
	Name        *string `json:"name" validate:"max=200"`
	TaxId       *string `json:"taxId" validate:"max=20"`
	MainEmail   *string `json:"mainEmail" validate:"email,max=200"`
	PhoneNumber *string `json:"phoneNumber" validate:"e164"`
}
