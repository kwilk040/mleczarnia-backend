package companies

import (
	"context"
	"errors"
	"fmt"
	"mleczania/internal/db"
	"mleczania/internal/db/sqlc"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type Service struct {
	query *sqlc.Queries
	pool  *pgxpool.Pool
}

func NewService(query *sqlc.Queries, pool *pgxpool.Pool) *Service {
	return &Service{query: query, pool: pool}
}

func (service *Service) ListCompanies(ctx context.Context) ([]Company, error) {
	rows, err := service.query.ListCompanies(ctx)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return mapCompaniesToDto(rows), nil
}

func (service *Service) GetCompany(ctx context.Context, companyId int32) (*CompanyWithDetails, error) {
	return db.WithinTransactionReturning(ctx, service.pool, func(tx pgx.Tx) (*CompanyWithDetails, error) {
		qtx := service.query.WithTx(tx)

		company, err := qtx.GetCompanyDetailsById(ctx, companyId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrCompanyNotFound
			}
			return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
		}

		addresses, err := qtx.ListCompanyAddresses(ctx, companyId)
		if err != nil {
			return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
		}

		response := &CompanyWithDetails{
			Name:             company.Name,
			TaxId:            company.TaxID,
			Email:            company.MainEmail,
			Status:           company.Status,
			OrderCount:       company.OrderCount,
			RegistrationDate: company.CreatedAt.Time,
			CompletedOrders:  company.CompletedOrders,
		}

		if company.Phone.Valid {
			response.PhoneNumber = &company.Phone.String
		}

		total, err := decimal.NewFromString(company.TotalOrdersValue)
		if err != nil {
			return nil, err
		}

		response.TotalOrdersValue = total

		response.Addresses = make([]Address, len(addresses))
		for i, address := range addresses {
			response.Addresses[i] = Address{
				Address:    address.AddressLine,
				City:       address.City,
				PostalCode: address.PostalCode,
				Country:    address.Country,
				Type:       address.Type,
			}
		}

		return response, nil
	})

}

func (service *Service) UpdateCompany(ctx context.Context, companyId int32, request UpdateCompanyRequest) error {
	_, err := service.query.UpdateCompany(ctx, buildUpdateCompanyParams(companyId, request))
	if err != nil {
		return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return nil
}

func (service *Service) ActivateCompany(ctx context.Context, companyId int32) error {
	return service.updateCompanyStatus(ctx, companyId, service.query.ActivateCompany, "activate")
}

func (service *Service) DeactivateCompany(ctx context.Context, companyId int32) error {
	return service.updateCompanyStatus(ctx, companyId, service.query.DeactivateCompany, "deactivate")
}

func (service *Service) updateCompanyStatus(ctx context.Context, companyId int32, operation func(context.Context, int32) (sqlc.CustomerCompany, error), operationName string) error {
	_, err := operation(ctx, companyId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrCompanyNotFound
		}
		return fmt.Errorf("%w: failed to %s company: %v", db.ErrDatabaseOperation, operationName, err)
	}

	return nil
}

func mapCompaniesToDto(rows []sqlc.ListCompaniesRow) []Company {
	result := make([]Company, len(rows))
	for i, row := range rows {
		company := Company{
			Id:               row.ID,
			Name:             row.Name,
			TaxId:            row.TaxID,
			Email:            row.MainEmail,
			OrderCount:       row.OrderCount,
			Status:           row.Status,
			RegistrationDate: row.CreatedAt.Time,
		}

		if row.Phone.Valid {
			company.PhoneNumber = &row.Phone.String
		}

		result[i] = company
	}
	return result
}

func buildUpdateCompanyParams(companyId int32, request UpdateCompanyRequest) sqlc.UpdateCompanyParams {
	params := sqlc.UpdateCompanyParams{
		ID: companyId,
	}

	if request.Name != nil {
		params.Name = pgtype.Text{
			String: *request.Name,
			Valid:  true,
		}
	}

	if request.TaxId != nil {
		params.TaxID = pgtype.Text{
			String: *request.TaxId,
			Valid:  true,
		}
	}

	if request.MainEmail != nil {
		params.MainEmail = pgtype.Text{
			String: *request.MainEmail,
			Valid:  true,
		}
	}

	if request.PhoneNumber != nil {
		params.Phone = pgtype.Text{
			String: *request.PhoneNumber,
			Valid:  true,
		}
	}

	return params
}
