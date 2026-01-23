package employees

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"mleczarnia/internal/db"
	"mleczarnia/internal/db/sqlc"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service struct {
	query *sqlc.Queries
}

func NewService(queries *sqlc.Queries) *Service {
	return &Service{query: queries}
}

func (service *Service) ListEmployees(ctx context.Context) ([]Employee, error) {
	employees, err := service.query.ListEmployees(ctx)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrEmployeesNotFound
		}
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	response := make([]Employee, len(employees))
	for i, r := range employees {
		response[i] = Employee{
			ID:        r.ID,
			FirstName: r.FirstName,
			LastName:  r.LastName,
			Position:  r.Position,
			IsActive:  r.IsActive,
			HireDate:  r.HireDate.Time,
		}
	}
	return response, nil
}

func (service *Service) GetEmployee(ctx context.Context, employeeId int32) (*Employee, error) {
	employee, err := service.query.GetEmployeeById(ctx, employeeId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrEmployeeNotFound
		}
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return &Employee{
		ID:        employee.ID,
		FirstName: employee.FirstName,
		LastName:  employee.LastName,
		Position:  employee.Position,
		IsActive:  employee.IsActive,
		HireDate:  employee.HireDate.Time,
	}, nil
}

func (service *Service) CreateEmployee(ctx context.Context, request CreateEmployeeRequest) (*Employee, error) {
	employee, err := service.query.CreateEmployee(ctx, sqlc.CreateEmployeeParams{
		FirstName: request.FirstName,
		LastName:  request.LastName,
		Position:  request.Position,
		HireDate: pgtype.Timestamptz{
			Time:  request.HireDate,
			Valid: true,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return &Employee{
		ID:        employee.ID,
		FirstName: employee.FirstName,
		LastName:  employee.LastName,
		Position:  employee.Position,
		IsActive:  employee.IsActive,
		HireDate:  employee.HireDate.Time,
	}, nil
}

func (service *Service) UpdateEmployee(ctx context.Context, id int32, request UpdateEmployeeRequest) error {
	if _, err := service.query.UpdateEmployee(ctx, sqlc.UpdateEmployeeParams{
		ID:        id,
		FirstName: db.ConvertToText(request.FirstName),
		LastName:  db.ConvertToText(request.LastName),
		Position:  db.ConvertToText(request.Position),
		IsActive:  db.ConvertToBool(request.IsActive),
		HireDate:  db.ConvertToTimestamptz(request.HireDate),
	}); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrEmployeeNotFound
		}
		return fmt.Errorf("%w: %v", db.ErrDatabaseOperation, err)
	}

	return nil
}
