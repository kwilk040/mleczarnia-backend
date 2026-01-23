package auth

import (
	"context"
	"errors"
	"fmt"
	"mleczarnia/internal/crypto"
	"mleczarnia/internal/db"
	"mleczarnia/internal/db/sqlc"
	"mleczarnia/internal/jwt"
	"mleczarnia/internal/users"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	RefreshTokenDuration = 30 * 24 * time.Hour
	AccessTokenDuration  = 1 * time.Hour
)

type Service struct {
	query      *sqlc.Queries
	jwtService *jwt.Service
	pool       *pgxpool.Pool
}

func NewService(query *sqlc.Queries, jwtService *jwt.Service, pool *pgxpool.Pool) *Service {
	return &Service{query: query, jwtService: jwtService, pool: pool}
}

func (service *Service) RegisterCompany(ctx context.Context, request RegisterCompanyRequest) error {
	hash, err := crypto.HashPassword(request.Password)
	if err != nil {
		return crypto.ErrPasswordHash
	}
	return db.WithinTransaction(ctx, service.pool, func(tx pgx.Tx) error {
		qtx := service.query.WithTx(tx)

		company, err := qtx.CreateCustomerCompany(ctx, sqlc.CreateCustomerCompanyParams{
			Name:      request.Name,
			TaxID:     request.TaxId,
			MainEmail: request.MainEmail,
			Phone:     db.ConvertToText(request.PhoneNumber),
		})
		if err != nil {
			return fmt.Errorf("%w: %v", ErrCompanyRegistration, err)
		}

		if err := service.createCompanyAddresses(ctx, qtx, company.ID, request.Addresses); err != nil {
			return err
		}

		if err := service.createCompanyUser(ctx, qtx, request.Email, hash, company.ID); err != nil {
			return err
		}

		return nil
	})
}

func (service *Service) Login(ctx context.Context, email, password string) (*TokenResponse, error) {
	return db.WithinTransactionReturning(ctx, service.pool, func(tx pgx.Tx) (*TokenResponse, error) {
		qtx := service.query.WithTx(tx)

		user, err := qtx.GetUserByEmail(ctx, email)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrInvalidCredentials
			}
			return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
		}

		if err := crypto.CheckPassword(user.PasswordHash, password); err != nil {
			return nil, ErrInvalidCredentials
		}

		if user.IsBlocked {
			return nil, ErrUserBlocked
		}

		accessToken, err := service.jwtService.CreateAccessToken(int(user.ID), user.Role, AccessTokenDuration)
		if err != nil {
			return nil, fmt.Errorf("%w: %v", ErrTokenCreation, err)
		}

		refreshToken, err := service.createRefreshToken(ctx, qtx, user.ID)
		if err != nil {
			return nil, err
		}

		_ = qtx.UpdateLastLogin(ctx, user.ID)

		return &TokenResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		}, nil
	})
}

func (service *Service) RefreshToken(ctx context.Context, token string) (*TokenResponse, error) {
	return db.WithinTransactionReturning(ctx, service.pool, func(tx pgx.Tx) (*TokenResponse, error) {
		qtx := service.query.WithTx(tx)

		oldRefreshToken, err := qtx.GetRefreshToken(ctx, token)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, jwt.ErrInvalidRefreshToken
			}
			return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
		}

		if oldRefreshToken.ExpiresAt.Time.Before(time.Now()) {
			_, _ = qtx.RevokeRefreshToken(ctx, token)
			return nil, jwt.ErrExpiredToken
		}

		user, err := qtx.GetUserByID(ctx, oldRefreshToken.UserID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, users.ErrUserNotFound
			}
			return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
		}

		if user.IsBlocked {
			return nil, ErrUserBlocked
		}

		accessToken, err := service.jwtService.CreateAccessToken(int(user.ID), user.Role, AccessTokenDuration)
		if err != nil {
			return nil, fmt.Errorf("%w: %v", ErrTokenCreation, err)
		}

		newRefreshToken, err := service.createRefreshToken(ctx, qtx, user.ID)
		if err != nil {
			return nil, err
		}

		return &TokenResponse{
			AccessToken:  accessToken,
			RefreshToken: newRefreshToken,
		}, nil
	})
}

func (service *Service) Logout(ctx context.Context, refreshToken string) error {
	if _, err := service.query.RevokeRefreshToken(ctx, refreshToken); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return jwt.ErrInvalidRefreshToken
		}

		return fmt.Errorf("%w: %v", ErrTokenRevocation, err)
	}

	return nil

}

func (service *Service) createCompanyAddresses(ctx context.Context, qtx *sqlc.Queries, companyID int32, addresses []Address) error {
	for _, address := range addresses {
		_, err := qtx.CreateCompanyAddress(ctx, sqlc.CreateCompanyAddressParams{
			CustomerCompanyID: companyID,
			AddressLine:       address.Address,
			City:              address.City,
			PostalCode:        address.PostalCode,
			Country:           address.Country,
			Type:              address.Type,
		})
		if err != nil {
			return fmt.Errorf("%w: %v", ErrAddressCreation, err)
		}
	}
	return nil
}

func (service *Service) createCompanyUser(ctx context.Context, qtx *sqlc.Queries, email, passwordHash string, companyID int32) error {
	_, err := qtx.CreateUserForCompany(ctx, sqlc.CreateUserForCompanyParams{
		Email:        email,
		PasswordHash: passwordHash,
		Role:         sqlc.RoleCLIENT,
		CustomerCompanyID: pgtype.Int4{
			Int32: companyID,
			Valid: true,
		},
	})
	if err != nil {
		return fmt.Errorf("%w: %v", ErrUserCreation, err)
	}
	return nil
}

func (service *Service) createRefreshToken(ctx context.Context, qtx *sqlc.Queries, userID int32) (string, error) {
	refreshToken := uuid.NewString()
	_, err := qtx.CreateRefreshToken(ctx, sqlc.CreateRefreshTokenParams{
		UserID: userID,
		Token:  refreshToken,
		ExpiresAt: pgtype.Timestamptz{
			Time:  time.Now().Add(RefreshTokenDuration),
			Valid: true,
		},
	})
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrTokenCreation, err)
	}
	return refreshToken, nil
}
