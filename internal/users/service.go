package users

import (
	"context"
	"errors"
	"fmt"
	"mleczarnia/internal/crypto"
	"mleczarnia/internal/db"
	"mleczarnia/internal/db/sqlc"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	query *sqlc.Queries
	pool  *pgxpool.Pool
}

func NewService(query *sqlc.Queries, pool *pgxpool.Pool) *Service {
	return &Service{query: query, pool: pool}
}

func (service *Service) ListUsers(ctx context.Context) ([]UserWithDetails, error) {
	users, err := service.query.ListUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return mapUsersToDTO(users), nil
}

func (service *Service) GetUserDetails(ctx context.Context, id int32) (*UserWithDetails, error) {
	user, err := service.query.GetUserWithDetailsById(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return mapUserToDTO(user.ID, user.Name, user.Email, user.Role, user.AccountType, user.Status, user.LastLoginAt), nil
}

func (service *Service) CreateUser(ctx context.Context, request CreateUserRequest) error {
	hash, err := crypto.HashPassword(request.Password)
	if err != nil {
		return fmt.Errorf("%w: %v", crypto.ErrPasswordHash, err)
	}

	return db.WithinTransaction(ctx, service.pool, func(tx pgx.Tx) error {
		qtx := service.query.WithTx(tx)

		switch request.AccountType {
		case sqlc.AccountTypeEMPLOYEE:
			return service.createUserForEmployee(ctx, qtx, request, hash)
		case sqlc.AccountTypeCUSTOMERCOMPANY:
			return service.createUserForCompany(ctx, qtx, request, hash)
		case sqlc.AccountTypeUNSPECIFIED:
			return service.createUnspecifiedUser(ctx, qtx, request, hash)
		default:
			return ErrInvalidAccountType
		}
	})

}

func (service *Service) UpdateUser(ctx context.Context, userId int32, request UpdateUserRequest) error {
	_, err := service.query.UpdateUser(ctx, buildUpdateUserParams(userId, request))
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

func (service *Service) BlockUser(ctx context.Context, userId int32) error {
	return service.updateUserStatus(ctx, userId, service.query.BlockUser, "block")
}

func (service *Service) UnblockUser(ctx context.Context, userId int32) error {
	return service.updateUserStatus(ctx, userId, service.query.UnblockUser, "unblock")
}

func mapUsersToDTO(rows []sqlc.ListUsersRow) []UserWithDetails {
	result := make([]UserWithDetails, len(rows))
	for i, row := range rows {
		result[i] = *mapUserToDTO(row.ID, row.Name, row.Email, row.Role, row.AccountType, row.Status, row.LastLoginAt)
	}
	return result
}

func mapUserToDTO(id int32, name, email string, role sqlc.Role, accountType sqlc.AccountType, status sqlc.UserStatus, lastLoginAt pgtype.Timestamptz) *UserWithDetails {
	dto := &UserWithDetails{
		UserId:      id,
		Email:       email,
		Role:        string(role),
		AccountType: string(accountType),
		Status:      string(status),
	}

	if name != "" {
		dto.Name = &name
	}

	if lastLoginAt.Valid {
		dto.LastLoginAt = &lastLoginAt.Time
	}

	return dto
}

func (service *Service) createUserForEmployee(ctx context.Context, qtx *sqlc.Queries, request CreateUserRequest, hash string) error {
	if _, err := qtx.GetEmployeeById(ctx, request.AssignTo); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrEmployeeNotFound
		}
		return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	_, err := qtx.CreateUserForEmployee(ctx, sqlc.CreateUserForEmployeeParams{
		Email:        request.Email,
		PasswordHash: hash,
		Role:         request.Role,
		EmployeeID: pgtype.Int4{
			Int32: request.AssignTo,
			Valid: true,
		},
	})
	if err != nil {
		return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return nil
}

func (service *Service) createUserForCompany(ctx context.Context, qtx *sqlc.Queries, request CreateUserRequest, hash string) error {
	if _, err := qtx.GetCustomerCompanyById(ctx, request.AssignTo); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrCompanyNotFound
		}
		return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	_, err := qtx.CreateUserForCompany(ctx, sqlc.CreateUserForCompanyParams{
		Email:        request.Email,
		PasswordHash: hash,
		Role:         request.Role,
		CustomerCompanyID: pgtype.Int4{
			Int32: request.AssignTo,
			Valid: true,
		},
	})
	if err != nil {
		return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return nil
}

func (service *Service) createUnspecifiedUser(ctx context.Context, qtx *sqlc.Queries, request CreateUserRequest, hash string) error {
	_, err := qtx.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        request.Email,
		PasswordHash: hash,
		Role:         request.Role,
	})
	if err != nil {
		return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return nil
}

func (service *Service) updateUserStatus(ctx context.Context, userId int32, operation func(context.Context, int32) (sqlc.UserAccount, error), operationName string) error {
	_, err := operation(ctx, userId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrUserNotFound
		}
		return fmt.Errorf("%w: failed to %s user: %v", db.ErrDatabaseOperation, operationName, err)
	}

	return nil
}

func buildUpdateUserParams(userId int32, request UpdateUserRequest) sqlc.UpdateUserParams {
	params := sqlc.UpdateUserParams{
		ID: userId,
	}

	if request.Email != nil {
		params.Email = pgtype.Text{
			String: *request.Email,
			Valid:  true,
		}
	}

	if request.Role != nil {
		params.Role = sqlc.NullRole{
			Role:  *request.Role,
			Valid: true,
		}
	}

	if request.AccountType != nil {
		params.AccountType = sqlc.NullAccountType{
			AccountType: *request.AccountType,
			Valid:       true,
		}
	}

	if request.AssignTo != nil {
		params.AssignTo = pgtype.Int4{
			Int32: *request.AssignTo,
			Valid: true,
		}
	}

	return params
}
