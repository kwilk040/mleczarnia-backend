package invoices

import (
	"time"

	"mleczarnia/internal/db/sqlc"
)

type ListInvoicesResponse struct {
	Invoices []InvoiceListItem `json:"invoices"`
}
type InvoiceListItem struct {
	Id            int32              `json:"id"`
	InvoiceNumber string             `json:"invoiceNumber"`
	OrderId       int32              `json:"orderId"`
	IssueDate     time.Time          `json:"issueDate"`
	DueDate       time.Time          `json:"dueDate"`
	TotalAmount   string             `json:"totalAmount"`
	Status        sqlc.InvoiceStatus `json:"status"`
}

type InvoiceDetails struct {
	Id            int32              `json:"id"`
	InvoiceNumber string             `json:"invoiceNumber"`
	IssueDate     time.Time          `json:"issueDate"`
	DueDate       time.Time          `json:"dueDate"`
	Status        sqlc.InvoiceStatus `json:"status"`
	CompanyName   string             `json:"companyName"`
	TaxId         string             `json:"taxId"`
	Email         string             `json:"email"`
	OrderNumber   string             `json:"orderNumber"`
	Items         []InvoiceItem      `json:"items"`
	TotalAmount   string             `json:"totalAmount"`
}

type InvoiceItem struct {
	ProductName string `json:"productName"`
	Unit        string `json:"unit"`
	Quantity    int32  `json:"quantity"`
	UnitPrice   string `json:"unitPrice"`
	LineTotal   string `json:"lineTotal"`
}

type UpdateInvoiceStatusRequest struct {
	Status sqlc.InvoiceStatus `json:"status" validate:"required,oneof=PAID UNPAID OVERDUE"`
}
