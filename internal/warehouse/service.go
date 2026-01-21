package warehouse

import (
	"context"
	"errors"
	"fmt"
	"mleczarnia/internal/db"

	"mleczarnia/internal/db/sqlc"

	"github.com/jackc/pgx/v5"
)

type Service struct {
	query *sqlc.Queries
}

func NewService(queries *sqlc.Queries) *Service {
	return &Service{query: queries}
}

func (service *Service) ListStock(ctx context.Context) ([]Stock, error) {
	rows, err := service.query.ListStock(ctx)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrStockNotFound
		}
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	result := make([]Stock, len(rows))
	for i, row := range rows {
		result[i] = Stock{
			ProductId:     row.ProductID,
			ProductName:   row.ProductName,
			Quantity:      row.Quantity,
			MinQuantity:   row.MinQuantity,
			IsLow:         row.Quantity < row.MinQuantity,
			DamagedCount:  row.DamagedCount,
			ReturnedCount: row.ReturnCount,
		}
	}

	return result, nil
}

func (service *Service) GetStockByProductId(ctx context.Context, productId int32) (*Stock, error) {
	row, err := service.query.GetStockByProductId(ctx, productId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrStockNotFound
		}
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)

	}

	return &Stock{
		ProductId:     row.ProductID,
		ProductName:   row.ProductName,
		Quantity:      row.Quantity,
		MinQuantity:   row.MinQuantity,
		IsLow:         row.Quantity < row.MinQuantity,
		DamagedCount:  row.DamagedCount,
		ReturnedCount: row.ReturnCount,
	}, nil
}

func (service *Service) UpdateStock(ctx context.Context, productId int32, request UpdateStockRequest) error {
	if _, err := service.query.UpdateStockByProductId(ctx, sqlc.UpdateStockByProductIdParams{
		ProductID:   productId,
		MinQuantity: request.MinQuantity,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrStockNotFound
		}
		return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}
	return nil
}
