package me

import (
	"context"
	"errors"
	"fmt"
	"mleczania/internal/crypto"
	"mleczania/internal/db"
	"mleczania/internal/db/sqlc"
	"mleczania/internal/users"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	query *sqlc.Queries
	pool  *pgxpool.Pool
}

func NewService(query *sqlc.Queries, pool *pgxpool.Pool) *Service {
	return &Service{query: query, pool: pool}
}

func (service *Service) GetProfile(ctx context.Context, userID int32) (*GetProfileResponse, error) {
	user, err := service.query.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, users.ErrUserNotFound
		}
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return mapUserToProfile(user), nil
}

func (service *Service) ChangePassword(ctx context.Context, userID int32, request ChangePasswordRequest) error {
	return db.WithinTransaction(ctx, service.pool, func(tx pgx.Tx) error {
		qtx := service.query.WithTx(tx)

		user, err := qtx.GetUserByID(ctx, userID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return users.ErrUserNotFound
			}
			return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
		}

		if err := crypto.CheckPassword(user.PasswordHash, request.CurrentPassword); err != nil {
			return crypto.ErrInvalidPassword
		}

		if err := crypto.CheckPassword(user.PasswordHash, request.NewPassword); err == nil {
			return crypto.ErrSamePassword
		}

		newHash, err := crypto.HashPassword(request.NewPassword)
		if err != nil {
			return err
		}

		if err := qtx.UpdatePassword(ctx, sqlc.UpdatePasswordParams{
			ID:           userID,
			PasswordHash: newHash,
		}); err != nil {
			return fmt.Errorf("%w: %v", ErrPasswordUpdateFailed, err)
		}

		if err := qtx.RevokeAllUserTokens(ctx, userID); err != nil {
			return fmt.Errorf("%w: %v", ErrAllTokenRevokeFailed, err)
		}

		return nil
	})
}

func mapUserToProfile(user sqlc.UserAccount) *GetProfileResponse {
	response := GetProfileResponse{
		Email: user.Email,
		Role:  string(user.Role),
	}

	if user.LastLoginAt.Valid {
		response.LastLoginAt = &user.LastLoginAt.Time
	}

	if user.CustomerCompanyID.Valid {
		response.CustomerCompanyId = &user.CustomerCompanyID.Int32
	}

	if user.EmployeeID.Valid {
		response.EmployeeId = &user.EmployeeID.Int32
	}

	return &response
}
