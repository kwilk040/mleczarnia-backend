package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type TxFunc func(pgx.Tx) error
type TxFuncValue[T any] func(pgx.Tx) (*T, error)

func New(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	return pgxpool.New(ctx, dsn)
}

func WithinTransaction(ctx context.Context, pool *pgxpool.Pool, fn TxFunc) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrTransactionStart, err)
	}

	defer tx.Rollback(ctx)

	if err := fn(tx); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("%w: %v", ErrTransactionCommit, err)
	}

	return nil
}

func WithinTransactionReturning[T any](ctx context.Context, pool *pgxpool.Pool, fn TxFuncValue[T]) (*T, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrTransactionStart, err)
	}

	defer tx.Rollback(ctx)

	result, err := fn(tx)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrTransactionCommit, err)
	}

	return result, nil
}

func ConvertToText(data *string) pgtype.Text {
	if data != nil {
		return pgtype.Text{
			String: *data,
			Valid:  true,
		}
	}

	return pgtype.Text{
		Valid: false,
	}
}

func ConvertToInt4(data *int32) pgtype.Int4 {
	if data != nil {
		return pgtype.Int4{
			Int32: *data,
			Valid: true,
		}
	}

	return pgtype.Int4{
		Valid: false,
	}
}

func ConvertToBool(data *bool) pgtype.Bool {
	if data != nil {
		return pgtype.Bool{
			Bool:  *data,
			Valid: true,
		}
	}

	return pgtype.Bool{
		Valid: false,
	}
}

func ConvertToTimestamptz(data *time.Time) pgtype.Timestamptz {
	if data != nil {
		return pgtype.Timestamptz{
			Time:  *data,
			Valid: true,
		}
	}

	return pgtype.Timestamptz{
		Valid: false,
	}
}

func DecimalToNumeric(data decimal.Decimal) (pgtype.Numeric, error) {
	n := pgtype.Numeric{}
	err := n.Scan(data.String())
	return n, err
}
