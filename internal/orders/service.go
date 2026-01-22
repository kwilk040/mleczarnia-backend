package orders

import (
	"context"
	"errors"
	"fmt"
	"mleczarnia/internal/db"
	"mleczarnia/internal/db/sqlc"
	"mleczarnia/internal/invoices"
	"mleczarnia/internal/products"

	"github.com/jackc/pgx/v5"
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

func (service *Service) CreateOrder(ctx context.Context, userId int32, req CreateOrderRequest) (*OrderResponse, error) {
	return db.WithinTransactionReturning(ctx, service.pool, func(tx pgx.Tx) (*OrderResponse, error) {
		qtx := service.query.WithTx(tx)

		companyId, err := qtx.GetCompanyIdForUserId(ctx, userId)
		if err != nil {
			return nil, invoices.ErrFailedToGetCompanyIdForUser
		}

		order, err := qtx.CreateOrder(ctx, companyId.Int32)
		if err != nil {
			return nil, ErrCouldNotCreateOrder
		}

		totalAmount := decimal.NewFromInt32(0)

		for _, item := range req.Items {
			product, err := qtx.GetProductById(ctx, item.ProductID)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					return nil, products.ErrProductNotFound
				}
				return nil, fmt.Errorf("%w : %v", db.ErrDatabaseOperation, err)
			}

			price, err := decimal.NewFromString(product.DefaultPriceText)
			if err != nil {
				return nil, err
			}

			lineTotal, err := db.DecimalToNumeric(decimal.NewFromInt32(item.Quantity).Mul(price))
			if err != nil {
				return nil, err
			}

			if _, err := qtx.InsertOrderItem(ctx, sqlc.InsertOrderItemParams{
				OrderID:   order.ID,
				ProductID: product.ID,
				Quantity:  item.Quantity,
				UnitPrice: product.DefaultPrice,
				LineTotal: lineTotal,
			}); err != nil {
				return nil, err
			}

			totalAmount = totalAmount.Add(price)
		}

		totalAmountNum, err := db.DecimalToNumeric(totalAmount)
		if err != nil {
			return nil, err
		}

		orderUpdated, err := qtx.SetOrderTotalAmount(ctx, sqlc.SetOrderTotalAmountParams{
			TotalAmount: totalAmountNum,
			ID:          order.ID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, err
			}
			return nil, err
		}

		return &OrderResponse{
			ID:          orderUpdated.ID,
			OrderNumber: orderUpdated.OrderNumber,
			Status:      orderUpdated.Status,
			TotalAmount: totalAmount.String(),
			OrderDate:   orderUpdated.OrderDate.Time,
		}, nil

	})
}

func (service *Service) ListOrders(ctx context.Context, userId int32, role sqlc.Role) (*[]OrderResponse, error) {
	return db.WithinTransactionReturning(ctx, service.pool, func(tx pgx.Tx) (*[]OrderResponse, error) {
		qtx := service.query.WithTx(tx)

		switch role {
		case sqlc.RoleCLIENT:
			companyId, err := qtx.GetCompanyIdForUserId(ctx, userId)
			if err != nil {
				return nil, invoices.ErrFailedToGetCompanyIdForUser
			}

			rows, err := qtx.ListOrdersByCustomer(ctx, companyId.Int32)
			if err != nil {
				return nil, fmt.Errorf("%w : %v", db.ErrDatabaseOperation, err)
			}
			res := make([]OrderResponse, len(rows))
			for i, r := range rows {
				res[i] = OrderResponse{
					ID:          r.ID,
					OrderNumber: r.OrderNumber,
					Status:      r.Status,
					TotalAmount: r.TotalAmount,
					OrderDate:   r.OrderDate.Time,
				}
			}
			return &res, nil
		default:
			rows, err := qtx.ListOrders(ctx)
			if err != nil {
				return nil, fmt.Errorf("%w : %v", db.ErrDatabaseOperation, err)
			}
			res := make([]OrderResponse, len(rows))
			for i, r := range rows {
				res[i] = OrderResponse{
					ID:          r.ID,
					OrderNumber: r.OrderNumber,
					Status:      r.Status,
					TotalAmount: r.TotalAmount,
					OrderDate:   r.OrderDate.Time,
				}
			}
			return &res, nil
		}
	})
}

func (service *Service) GetOrder(ctx context.Context, orderId int32, role sqlc.Role, userId int32) (*OrderResponse, error) {
	return db.WithinTransactionReturning(ctx, service.pool, func(tx pgx.Tx) (*OrderResponse, error) {
		qtx := service.query.WithTx(tx)

		order, err := qtx.GetOrderById(ctx, orderId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrOrderNotFound
			}
			return nil, err
		}

		if role == sqlc.RoleCLIENT {
			companyId, err := qtx.GetCompanyIdForUserId(ctx, userId)
			if err != nil {
				return nil, invoices.ErrFailedToGetCompanyIdForUser
			}

			if order.CustomerID != companyId.Int32 {
				return nil, ErrOrderForbidden
			}
		}

		return &OrderResponse{
			ID:          order.ID,
			OrderNumber: order.OrderNumber,
			Status:      order.Status,
			TotalAmount: order.TotalAmount,
			OrderDate:   order.OrderDate.Time,
		}, nil
	})
}

func (service *Service) GetOrderItems(ctx context.Context, orderId int32, role sqlc.Role, userId int32) (*[]OrderItemResponse, error) {
	return db.WithinTransactionReturning(ctx, service.pool, func(tx pgx.Tx) (*[]OrderItemResponse, error) {
		qtx := service.query.WithTx(tx)

		order, err := qtx.GetOrderById(ctx, orderId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrOrderNotFound
			}
			return nil, err
		}

		if role == sqlc.RoleCLIENT {
			companyId, err := qtx.GetCompanyIdForUserId(ctx, userId)
			if err != nil {
				return nil, invoices.ErrFailedToGetCompanyIdForUser
			}

			if order.CustomerID != companyId.Int32 {
				return nil, ErrOrderForbidden
			}
		}

		rows, err := qtx.GetOrderItems(ctx, orderId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrOrderNotFound
			}
			return nil, err
		}

		items := make([]OrderItemResponse, len(rows))
		for i, row := range rows {
			items[i] = OrderItemResponse{
				ID:          row.ID,
				ProductID:   row.ProductID,
				ProductName: row.ProductName,
				Quantity:    row.Quantity,
				UnitPrice:   row.UnitPrice,
				LineTotal:   row.LineTotal,
			}
		}
		return &items, nil
	})
}

func (service *Service) UpdateOrderStatus(ctx context.Context, orderId int32, newStatus sqlc.OrderStatus) error {
	return db.WithinTransaction(ctx, service.pool, func(tx pgx.Tx) error {
		qtx := service.query.WithTx(tx)

		order, err := qtx.GetOrderById(ctx, orderId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrOrderNotFound
			}
			return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
		}

		if !isValidStatusTransition(order.Status, newStatus) {
			return ErrInvalidStatusTransition
		}

		if err := qtx.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
			ID:     orderId,
			Status: newStatus,
		}); err != nil {
			return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
		}

		return nil
	})
}

func isValidStatusTransition(current, next sqlc.OrderStatus) bool {
	switch current {
	case sqlc.OrderStatusNEW:
		return next == sqlc.OrderStatusINPREPARATION || next == sqlc.OrderStatusCANCELLED
	case sqlc.OrderStatusINPREPARATION:
		return next == sqlc.OrderStatusSHIPPED || next == sqlc.OrderStatusCANCELLED
	default:
		return false
	}
}
