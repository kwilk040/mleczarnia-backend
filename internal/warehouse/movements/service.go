package movements

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"

	"mleczarnia/internal/db"
	"mleczarnia/internal/db/sqlc"
)

type Service struct {
	query *sqlc.Queries
	pool  *pgxpool.Pool
}

func NewService(queries *sqlc.Queries, pool *pgxpool.Pool) *Service {
	return &Service{query: queries, pool: pool}
}

func (service *Service) ListMovements(ctx context.Context) ([]StockMovement, error) {
	rows, err := service.query.ListStockMovements(ctx)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrMovementNotFound
		}
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	result := make([]StockMovement, len(rows))
	for i, row := range rows {
		stockMovement := StockMovement{
			Id:             row.ID,
			ProductId:      row.ProductID,
			QuantityChange: row.QuantityChange,
			MovementType:   row.MovementType,
		}

		if row.RelatedOrderID.Valid {
			stockMovement.RelatedOrderId = &row.RelatedOrderID.Int32
		}

		if row.Reason.Valid {
			stockMovement.Reason = &row.Reason.String
		}

		if row.CreatedAt.Valid {
			stockMovement.CreatedAt = row.CreatedAt.Time
		}

		if row.EmployeeID.Valid {
			stockMovement.EmployeeId = &row.EmployeeID.Int32
		}

		result[i] = stockMovement
	}

	return result, nil
}

func (service *Service) Inbound(ctx context.Context, req InboundRequest, empId *int32) (*sqlc.StockMovement, error) {
	return service.applyMovement(
		ctx,
		req.ProductId,
		req.Quantity,
		sqlc.MovementTypeINBOUND,
		nil,
		&req.Reason,
		empId,
	)
}

func (service *Service) Dispatch(ctx context.Context, req DispatchRequest, empId *int32) (*sqlc.StockMovement, error) {
	return service.applyMovement(
		ctx,
		req.ProductId,
		-req.Quantity,
		sqlc.MovementTypeDISPATCH,
		nil,
		&req.Reason,
		empId,
	)
}

func (service *Service) Return(ctx context.Context, req ReturnRequest, empId *int32) (*sqlc.StockMovement, error) {
	return service.applyMovement(
		ctx,
		req.ProductId,
		req.Quantity,
		sqlc.MovementTypeRETURN,
		&req.OrderId,
		&req.Reason,
		empId,
	)
}

func (service *Service) Loss(ctx context.Context, req LossRequest, empId *int32) (*sqlc.StockMovement, error) {
	return service.applyMovement(
		ctx,
		req.ProductId,
		-req.Quantity,
		sqlc.MovementTypeLOSS,
		nil,
		&req.Reason,
		empId,
	)
}

func (service *Service) applyMovement(
	ctx context.Context,
	productId int32,
	qtyChange int32,
	mType sqlc.MovementType,
	orderId *int32,
	reason *string,
	employeeId *int32,
) (*sqlc.StockMovement, error) {
	return db.WithinTransactionReturning(ctx, service.pool, func(tx pgx.Tx) (*sqlc.StockMovement, error) {
		qtx := service.query.WithTx(tx)

		stock, err := qtx.GetStockForUpdate(ctx, productId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				stock, err = qtx.CreateStock(ctx, sqlc.CreateStockParams{
					ProductID:   productId,
					Quantity:    0,
					MinQuantity: 10,
				})
				if err != nil {
					logrus.WithError(err).Error("Could not create stock")
					return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
				}
			}
		}

		newQty := stock.Quantity + qtyChange
		if newQty < 0 {
			return nil, ErrInsufficientStock
		}

		if err := qtx.UpdateStockQuantity(ctx, sqlc.UpdateStockQuantityParams{
			ProductID: productId,
			Quantity:  newQty,
		}); err != nil {
			return nil, err
		}

		params := sqlc.CreateStockMovementParams{
			ProductID:      productId,
			QuantityChange: qtyChange,
			MovementType:   mType,
			RelatedOrderID: db.ConvertToInt4(orderId),
			Reason:         db.ConvertToText(reason),
			EmployeeID:     db.ConvertToInt4(employeeId),
		}

		movement, err := qtx.CreateStockMovement(ctx, params)
		if err != nil {
			return nil, err
		}

		return &movement, nil
	})
}
