package warehouse

type Stock struct {
	ProductId     int32  `json:"productId"`
	ProductName   string `json:"productName"`
	Quantity      int32  `json:"quantity"`
	MinQuantity   int32  `json:"minQuantity"`
	IsLow         bool   `json:"isLow"`
	DamagedCount  int32  `json:"damagedCount"`
	ReturnedCount int32  `json:"returnedCount"`
}

type ListStockResponse struct {
	Stocks []Stock `json:"stocks"`
}

type UpdateStockRequest struct {
	MinQuantity int32 `json:"minQuantity" validate:"required"`
}
