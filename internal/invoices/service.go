package invoices

import (
	"context"
	"errors"
	"fmt"
	"mleczarnia/internal/db"
	"time"

	"mleczarnia/internal/db/sqlc"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type Service struct {
	query *sqlc.Queries
	pool  *pgxpool.Pool
}

func NewService(queries *sqlc.Queries, pool *pgxpool.Pool) *Service {
	return &Service{query: queries, pool: pool}
}

func (service *Service) ListInvoices(
	ctx context.Context,
	role sqlc.Role,
	userId int32,
) (*[]InvoiceListItem, error) {
	return db.WithinTransactionReturning(ctx, service.pool, func(tx pgx.Tx) (*[]InvoiceListItem, error) {
		qtx := service.query.WithTx(tx)

		switch role {
		case sqlc.RoleCLIENT:
			companyId, err := qtx.GetCompanyIdForUserId(ctx, userId)
			if err != nil {
				return nil, ErrFailedToGetCompanyIdForUser
			}

			rows, err := qtx.ListInvoicesForCompany(ctx, companyId.Int32)
			if err != nil {
				return nil, fmt.Errorf("%w : %v", db.ErrDatabaseOperation, err)
			}

			result := make([]InvoiceListItem, len(rows))
			for i, r := range rows {
				result[i] = InvoiceListItem{
					Id:            r.ID,
					InvoiceNumber: r.InvoiceNumber,
					OrderId:       r.OrderID,
					IssueDate:     r.IssueDate.Time,
					DueDate:       r.DueDate.Time,
					TotalAmount:   r.TotalAmount,
					Status:        r.Status,
				}
			}

			return &result, nil
		default:
			rows, err := qtx.ListInvoices(ctx)
			if err != nil {
				return nil, fmt.Errorf("%w : %v", db.ErrDatabaseOperation, err)
			}

			result := make([]InvoiceListItem, len(rows))
			for i, r := range rows {
				result[i] = InvoiceListItem{
					Id:            r.ID,
					InvoiceNumber: r.InvoiceNumber,
					OrderId:       r.OrderID,
					IssueDate:     r.IssueDate.Time,
					DueDate:       r.DueDate.Time,
					TotalAmount:   r.TotalAmount,
					Status:        r.Status,
				}
			}

			return &result, nil
		}
	})
}

func (service *Service) GetInvoiceById(
	ctx context.Context,
	invoiceId int32,
	role sqlc.Role,
	userId int32,
) (*InvoiceDetails, error) {
	return db.WithinTransactionReturning(ctx, service.pool, func(tx pgx.Tx) (*InvoiceDetails, error) {
		qtx := service.query.WithTx(tx)

		invoice, err := qtx.GetInvoiceWithOrder(ctx, invoiceId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrInvoiceNotFound
			}
			return nil, err
		}

		if role == sqlc.RoleCLIENT {
			companyId, err := qtx.GetCompanyIdForUserId(ctx, userId)
			if err != nil {
				return nil, ErrFailedToGetCompanyIdForUser
			}

			if invoice.CustomerID != companyId.Int32 {
				return nil, ErrInvoiceForbidden
			}
		}

		items, err := qtx.GetInvoiceItems(ctx, invoice.OrderID)
		if err != nil {
			return nil, err
		}

		details := InvoiceDetails{
			Id:            invoice.ID,
			InvoiceNumber: invoice.InvoiceNumber,
			IssueDate:     invoice.IssueDate.Time,
			DueDate:       invoice.DueDate.Time,
			Status:        invoice.Status,
			CompanyName:   invoice.CompanyName,
			TaxId:         invoice.TaxID,
			Email:         invoice.MainEmail,
			OrderNumber:   invoice.OrderNumber,
			TotalAmount:   invoice.TotalAmountStr,
		}

		for _, it := range items {
			details.Items = append(details.Items, InvoiceItem{
				ProductName: it.ProductName,
				Unit:        it.Unit,
				Quantity:    it.Quantity,
				UnitPrice:   it.UnitPrice,
				LineTotal:   it.LineTotal,
			})
		}

		return &details, nil
	})
}

func (service *Service) CreateInvoiceForOrder(ctx context.Context, orderId int32) error {
	return db.WithinTransaction(ctx, service.pool, func(tx pgx.Tx) error {
		qtx := service.query.WithTx(tx)

		//TODO: change order status

		exists, err := qtx.InvoiceExistsForOrder(ctx, orderId)
		if err != nil {
			return err
		}
		if exists {
			return ErrInvoiceAlreadyExists
		}

		items, err := qtx.GetInvoiceItems(ctx, orderId)
		if err != nil {
			return err
		}

		var total decimal.Decimal
		for _, it := range items {
			dec, err := decimal.NewFromString(it.LineTotal)
			if err != nil {
				return ErrFailedToCreateDecimal
			}
			total = total.Add(dec)
		}

		totalAmount, err := db.DecimalToNumeric(total)
		if err != nil {
			return err
		}

		_, err = qtx.CreateInvoice(ctx, sqlc.CreateInvoiceParams{
			OrderID: orderId,
			IssueDate: pgtype.Timestamptz{
				Time:  time.Now(),
				Valid: true,
			},
			DueDate: pgtype.Timestamptz{
				Time:  time.Now().AddDate(0, 0, 14),
				Valid: true,
			},
			TotalAmount: totalAmount,
		})

		return err
	})
}

func (service *Service) UpdateInvoiceStatus(
	ctx context.Context,
	invoiceId int32,
	newStatus sqlc.InvoiceStatus,
) error {
	return db.WithinTransaction(ctx, service.pool, func(tx pgx.Tx) error {
		qtx := service.query.WithTx(tx)

		// TODO: change order status
		inv, err := qtx.GetInvoiceById(ctx, invoiceId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrInvoiceNotFound
			}
			return err
		}

		if !isValidStatusTransition(inv.Status, newStatus) {
			return ErrInvalidStatusChange
		}

		_, err = qtx.UpdateInvoiceStatus(ctx, sqlc.UpdateInvoiceStatusParams{
			ID:     invoiceId,
			Status: newStatus,
		})

		return err
	})
}

func isValidStatusTransition(from, to sqlc.InvoiceStatus) bool {
	switch from {
	case sqlc.InvoiceStatusUNPAID:
		return to == sqlc.InvoiceStatusPAID || to == sqlc.InvoiceStatusOVERDUE
	case sqlc.InvoiceStatusOVERDUE:
		return to == sqlc.InvoiceStatusPAID
	default:
		return false
	}
}
