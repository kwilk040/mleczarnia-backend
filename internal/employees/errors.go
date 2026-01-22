package employees

import "errors"

var (
	ErrEmployeeIdRequired = errors.New("employee id required")
	ErrInvalidEmployeeId  = errors.New("invalid employee id")
	ErrEmployeeNotFound   = errors.New("employee not found")
	ErrEmployeesNotFound  = errors.New("employees not found")
)
