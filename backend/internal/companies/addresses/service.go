package addresses

import (
	"context"
	"errors"
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

func (s *Service) ListAddresses(ctx context.Context, companyId int32) ([]AddressResponse, error) {
	rows, err := s.query.ListCompanyAddresses(ctx, companyId)
	if err != nil {
		return nil, err
	}

	result := make([]AddressResponse, len(rows))
	for i, r := range rows {
		result[i] = mapAddress(r)
	}
	return result, nil
}

func (s *Service) CreateAddress(ctx context.Context, companyId int32, request CreateAddressRequest) error {
	_, err := s.query.CreateCompanyAddress(ctx, sqlc.CreateCompanyAddressParams{
		CustomerCompanyID: companyId,
		AddressLine:       request.Address,
		City:              request.City,
		PostalCode:        request.PostalCode,
		Country:           request.Country,
		Type:              request.Type,
	})
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) UpdateAddress(ctx context.Context, companyId, addressId int32, request UpdateAddressRequest) error {
	_, err := s.query.UpdateCompanyAddress(ctx, buildUpdateAddressParams(companyId, addressId, request))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrAddressNotFound
		}
		return err
	}

	return nil
}

func mapAddress(address sqlc.CompanyAddress) AddressResponse {
	return AddressResponse{
		Id:         address.ID,
		Address:    address.AddressLine,
		City:       address.City,
		PostalCode: address.PostalCode,
		Country:    address.Country,
		Type:       address.Type,
	}
}

func buildUpdateAddressParams(companyId, addressId int32, request UpdateAddressRequest) sqlc.UpdateCompanyAddressParams {
	params := sqlc.UpdateCompanyAddressParams{
		ID:                addressId,
		CustomerCompanyID: companyId,
	}

	if request.Address != nil {
		params.AddressLine = pgtype.Text{String: *request.Address, Valid: true}
	}
	if request.City != nil {
		params.City = pgtype.Text{String: *request.City, Valid: true}
	}
	if request.PostalCode != nil {
		params.PostalCode = pgtype.Text{String: *request.PostalCode, Valid: true}
	}
	if request.Country != nil {
		params.Country = pgtype.Text{String: *request.Country, Valid: true}
	}
	if request.Type != nil {
		params.Type = sqlc.NullAddressType{AddressType: *request.Type, Valid: true}
	}

	return params
}
