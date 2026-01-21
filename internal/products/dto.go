package products

import "github.com/shopspring/decimal"

type Product struct {
	Id            int32           `json:"id"`
	Name          string          `json:"name"`
	Category      string          `json:"category"`
	Unit          string          `json:"unit"`
	DefaultPrice  decimal.Decimal `json:"defaultPrice"`
	IsActive      bool            `json:"isActive"`
	Quantity      int32           `json:"quantity"`
	MinQuantity   int32           `json:"minQuantity"`
	IsLow         bool            `json:"isLow"`
	DamagedCount  int32           `json:"damagedCount"`
	ReturnedCount int32           `json:"returnedCount"`
}

type ListProductsResponse struct {
	Products []Product `json:"products"`
}

type CreateProductRequest struct {
	Name         string          `json:"name" validate:"required,max=200"`
	Category     string          `json:"category" validate:"required,max=100"`
	Unit         string          `json:"unit" validate:"required,max=50"`
	DefaultPrice decimal.Decimal `json:"defaultPrice" validate:"required,decimalpos"`
}

type UpdateProductRequest struct {
	Name         *string          `json:"name" validate:"omitempty,max=200"`
	Category     *string          `json:"category" validate:"omitempty,max=100"`
	Unit         *string          `json:"unit" validate:"omitempty,max=50"`
	DefaultPrice *decimal.Decimal `json:"defaultPrice" validate:"omitempty"`
}
