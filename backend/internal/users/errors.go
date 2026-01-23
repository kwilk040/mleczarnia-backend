package users

import "errors"

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmployeeNotFound   = errors.New("employee not found")
	ErrCompanyNotFound    = errors.New("customer company not found")
	ErrAssignToRequired   = errors.New("assignTo is required for EMPLOYEE and CUSTOMER_COMPANY accounts")
	ErrInvalidAccountType = errors.New("invalid account type")
	ErrUserIdRequired     = errors.New("userId is required")
	ErrInvalidUserId      = errors.New("invalid userId")
)
