package employees

import "time"

type ListEmployeesResponse struct {
	Employees []Employee `json:"employees"`
}

type Employee struct {
	ID        int32     `json:"id"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Position  string    `json:"position"`
	IsActive  bool      `json:"isActive"`
	HireDate  time.Time `json:"hireDate"`
}

type CreateEmployeeRequest struct {
	FirstName string    `json:"firstName" validate:"required,max=100"`
	LastName  string    `json:"lastName" validate:"required,max=100"`
	Position  string    `json:"position" validate:"required,max=100"`
	HireDate  time.Time `json:"hireDate" validate:"required"`
}

type UpdateEmployeeRequest struct {
	FirstName *string    `json:"firstName" validate:"omitempty,max=100"`
	LastName  *string    `json:"lastName" validate:"omitempty,max=100"`
	Position  *string    `json:"position" validate:"omitempty,max=100"`
	IsActive  *bool      `json:"isActive"`
	HireDate  *time.Time `json:"hireDate"`
}
