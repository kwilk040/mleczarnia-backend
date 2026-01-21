package products

import (
	"context"
	"errors"
	"fmt"
	"mleczarnia/internal/db"
	"mleczarnia/internal/db/sqlc"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

type Service struct {
	query *sqlc.Queries
}

func NewService(q *sqlc.Queries) *Service {
	return &Service{query: q}
}

func (service *Service) ListProducts(ctx context.Context) ([]Product, error) {
	rows, err := service.query.ListProducts(ctx)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	result := make([]Product, len(rows))
	for i, r := range rows {
		product, err := mapProduct(r)
		if err != nil {
			return nil, err
		}
		result[i] = *product
	}
	return result, nil
}

func (service *Service) GetProduct(ctx context.Context, productId int32) (*Product, error) {
	row, err := service.query.GetProductById(ctx, productId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProductNotFound
		}
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	price, err := decimal.NewFromString(row.DefaultPriceText)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrFailedToConvertDecimal, err)
	}

	return &Product{
		Id:           row.ID,
		Name:         row.Name,
		Category:     row.Category,
		Unit:         row.Unit,
		DefaultPrice: price,
		IsActive:     row.IsActive,
	}, nil
}

func (service *Service) CreateProduct(ctx context.Context, request CreateProductRequest) error {
	price, err := convertDecimalToNumeric(request.DefaultPrice)
	if err != nil {
		return err
	}

	if _, err := service.query.CreateProduct(ctx, sqlc.CreateProductParams{
		Name:         request.Name,
		Category:     request.Category,
		Unit:         request.Unit,
		DefaultPrice: *price,
	}); err != nil {
		return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return nil
}

func (service *Service) UpdateProduct(ctx context.Context, productId int32, request UpdateProductRequest) error {
	params, err := buildUpdateProductParams(productId, request)
	if err != nil {
		return err
	}
	if _, err := service.query.UpdateProduct(ctx, *params); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrProductNotFound
		}
		return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return nil
}

func (service *Service) ActivateProduct(ctx context.Context, productId int32) error {
	return service.updateProductStatus(ctx, productId, service.query.ActivateProduct, "activate")
}

func (service *Service) DeactivateProduct(ctx context.Context, productId int32) error {
	return service.updateProductStatus(ctx, productId, service.query.DeactivateProduct, "deactivate")
}

func (service *Service) updateProductStatus(
	ctx context.Context,
	product int32,
	fn func(context.Context, int32) (sqlc.Product, error),
	operation string,
) error {
	_, err := fn(ctx, product)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrProductNotFound
		}
		return fmt.Errorf("%w: failed to %s product: %v", db.ErrDatabaseOperation, operation, err)
	}
	return nil
}

func mapProduct(product sqlc.ListProductsRow) (*Product, error) {
	price, err := decimal.NewFromString(product.DefaultPriceText)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrFailedToConvertDecimal, err)
	}

	return &Product{
		Id:            product.ID,
		Name:          product.Name,
		Category:      product.Category,
		Unit:          product.Unit,
		DefaultPrice:  price,
		IsActive:      product.IsActive,
		Quantity:      product.Quantity,
		MinQuantity:   product.MinQuantity,
		IsLow:         product.Quantity < product.MinQuantity,
		DamagedCount:  product.DamagedCount,
		ReturnedCount: product.ReturnCount,
	}, nil
}

func buildUpdateProductParams(productId int32, request UpdateProductRequest) (*sqlc.UpdateProductParams, error) {
	params := sqlc.UpdateProductParams{ID: productId}

	if request.Name != nil {
		params.Name = pgtype.Text{String: *request.Name, Valid: true}
	}
	if request.Category != nil {
		params.Category = pgtype.Text{String: *request.Category, Valid: true}
	}
	if request.Unit != nil {
		params.Unit = pgtype.Text{String: *request.Unit, Valid: true}
	}
	if request.DefaultPrice != nil {
		price, err := convertDecimalToNumeric(*request.DefaultPrice)
		if err != nil {
			return nil, err
		}
		params.DefaultPrice = *price
	}

	return &params, nil
}

func convertDecimalToNumeric(dec decimal.Decimal) (*pgtype.Numeric, error) {
	var price pgtype.Numeric
	err := price.Scan(dec.String())
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrFailedToParseDecimal, err)
	}
	return &price, nil
}
