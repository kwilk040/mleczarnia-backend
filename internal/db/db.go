package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
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
	} else {
		return pgtype.Text{
			Valid: false,
		}
	}
}
