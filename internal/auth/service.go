package auth

import (
	"context"
	"errors"
	"fmt"
	"mleczania/internal/db"
	"mleczania/internal/db/sqlc"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

const (
	RefreshTokenDuration = 30 * 24 * time.Hour
	AccessTokenDuration  = 1 * time.Hour
)

type Service struct {
	query     *sqlc.Queries
	jwtSecret []byte
	pool      *pgxpool.Pool
}

func NewService(query *sqlc.Queries, jwtSecret []byte, pool *pgxpool.Pool) *Service {
	return &Service{query: query, jwtSecret: jwtSecret, pool: pool}
}

func (service *Service) RegisterCompany(ctx context.Context, body RegisterCompanyRequest, role sqlc.Role) error {
	tx, err := service.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := service.query.WithTx(tx)

	company, err := qtx.CreateCustomerCompany(ctx, sqlc.CreateCustomerCompanyParams{
		Name:      body.Name,
		TaxID:     body.TaxId,
		MainEmail: body.MainEmail,
		Phone:     db.ConvertToText(body.PhoneNumber),
	})
	if err != nil {
		return fmt.Errorf("failed to create company: %w", err)
	}

	for _, address := range body.Addresses {
		_, err := qtx.CreateCompanyAddress(ctx, sqlc.CreateCompanyAddressParams{
			CustomerCompanyID: company.ID,
			AddressLine:       address.Address,
			City:              address.City,
			PostalCode:        address.PostalCode,
			Country:           address.Country,
			Type:              address.Type,
		})
		if err != nil {
			return fmt.Errorf("failed to create address: %w", err)
		}
	}

	hash, err := HashPassword(body.Password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	_, err = qtx.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        body.Email,
		PasswordHash: hash,
		Role:         role,
	})
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (service *Service) Login(ctx context.Context, email, password string) (string, string, error) {
	tx, err := service.pool.Begin(ctx)
	if err != nil {
		return "", "", fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := service.query.WithTx(tx)

	user, err := qtx.GetUserByEmail(ctx, email)
	if err != nil {
		return "", "", errors.New("invalid credentials")
	}

	if CheckPassword(user.PasswordHash, password) != nil {
		return "", "", errors.New("invalid credentials")
	}

	access, err := CreateAccessToken(int(user.ID), user.Role, service.jwtSecret, AccessTokenDuration)
	if err != nil {
		return "", "", fmt.Errorf("failed to create access token: %w", err)
	}

	refreshToken := uuid.NewString()
	_, err = qtx.CreateRefreshToken(ctx, sqlc.CreateRefreshTokenParams{
		UserID: user.ID,
		Token:  refreshToken,
		ExpiresAt: pgtype.Timestamptz{
			Time:  time.Now().Add(RefreshTokenDuration),
			Valid: true,
		},
	})

	if err := qtx.UpdateLastLogin(ctx, user.ID); err != nil {
		logrus.WithError(err).Warn("failed to update last login")
	}

	if err := tx.Commit(ctx); err != nil {
		return "", "", fmt.Errorf("failed to commit transaction: %w", err)
	}
	return access, refreshToken, err
}

func (service *Service) RefreshToken(ctx context.Context, token string) (string, string, error) {
	tx, err := service.pool.Begin(ctx)
	if err != nil {
		return "", "", fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := service.query.WithTx(tx)

	oldRefreshToken, err := qtx.GetRefreshToken(ctx, token)
	if err != nil {
		return "", "", errors.New("invalid refresh token")
	}

	if oldRefreshToken.ExpiresAt.Time.Before(time.Now()) {
		_ = qtx.RevokeRefreshToken(ctx, token)
		return "", "", errors.New("refresh token expired")
	}

	user, err := qtx.GetUserByID(ctx, oldRefreshToken.UserID)
	if err != nil {
		return "", "", errors.New("user not found")
	}

	if !user.IsActive {
		return "", "", errors.New("user is not active")
	}

	accessToken, err := CreateAccessToken(int(user.ID), user.Role, service.jwtSecret, AccessTokenDuration)
	if err != nil {
		return "", "", fmt.Errorf("failed to create access token: %w", err)
	}

	newRefreshToken := uuid.NewString()
	_, err = qtx.CreateRefreshToken(ctx, sqlc.CreateRefreshTokenParams{
		UserID: user.ID,
		Token:  newRefreshToken,
		ExpiresAt: pgtype.Timestamptz{
			Time:  time.Now().Add(RefreshTokenDuration),
			Valid: true,
		},
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to create new refresh token: %w", err)
	}

	if err := qtx.RevokeRefreshToken(ctx, oldRefreshToken.Token); err != nil {
		return "", "", fmt.Errorf("failed to revoke old refresh token: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return "", "", fmt.Errorf("failed to commit transaction: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"user_id": user.ID,
		"email":   user.Email,
	}).Info("refresh token rotated successfully")

	return accessToken, newRefreshToken, nil
}

func (service *Service) Logout(ctx context.Context, refreshToken string) error {
	err := service.query.RevokeRefreshToken(ctx, refreshToken)
	if err != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", err)
	}
	return nil
}
