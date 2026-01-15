package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

func New(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	return pgxpool.New(ctx, dsn)
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
