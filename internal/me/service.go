package me

import (
	"context"
	"errors"
	"fmt"
	"mleczania/internal/auth"
	"mleczania/internal/db/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

type Service struct {
	query *sqlc.Queries
	pool  *pgxpool.Pool
}

func NewService(query *sqlc.Queries, pool *pgxpool.Pool) *Service {
	return &Service{query: query, pool: pool}
}

func (service *Service) GetProfile(ctx context.Context, userID int32) (GetProfileResponse, error) {
	user, err := service.query.GetUserByID(ctx, userID)
	if err != nil {
		return GetProfileResponse{}, errors.New("user not found")
	}

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

	return response, nil
}

func (service *Service) ChangePassword(ctx context.Context, userID int32, currentPassword, newPassword string) error {
	tx, err := service.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := service.query.WithTx(tx)

	user, err := qtx.GetUserByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}

	if err := auth.CheckPassword(user.PasswordHash, currentPassword); err != nil {
		logrus.WithFields(logrus.Fields{
			"user_id": userID,
			"email":   user.Email,
		}).Warn("failed password change attempt - incorrect current password")
		return errors.New("current password is incorrect")
	}

	if err := auth.CheckPassword(user.PasswordHash, newPassword); err == nil {
		return errors.New("new password must be different from current password")
	}

	newHash, err := auth.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	if err := qtx.UpdatePassword(ctx, sqlc.UpdatePasswordParams{
		ID:           userID,
		PasswordHash: newHash,
	}); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	if err := qtx.RevokeAllUserTokens(ctx, userID); err != nil {
		return fmt.Errorf("failed to revoke tokens: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"user_id": userID,
		"email":   user.Email,
	}).Info("password changed successfully")

	return nil
}
