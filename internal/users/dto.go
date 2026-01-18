package users

import (
	"mleczania/internal/db/sqlc"
	"time"
)

type UserWithDetails struct {
	UserId      int32      `json:"userId"`
	Name        *string    `json:"name"`
	Email       string     `json:"email"`
	Role        string     `json:"role"`
	AccountType string     `json:"accountType"`
	Status      string     `json:"status"`
	LastLoginAt *time.Time `json:"lastLoginAt"`
}

type ListUsersResponse struct {
	Users []UserWithDetails `json:"users"`
}

type CreateUserRequest struct {
	Email       string           `json:"email" validate:"required,email"`
	Password    string           `json:"password" validate:"required"`
	Role        sqlc.Role        `json:"role" validate:"required,oneof=ADMIN STAFF WAREHOUSE CLIENT"`
	AssignTo    int32            `json:"AssignTo" validate:"required"`
	AccountType sqlc.AccountType `json:"accountType" validate:"required,oneof=CUSTOMER_COMPANY EMPLOYEE UNSPECIFIED"`
}

type UpdateUserRequest struct {
	Email       *string           `json:"email" validate:"email"`
	Role        *sqlc.Role        `json:"role" validate:"oneof=ADMIN STAFF WAREHOUSE CLIENT"`
	AssignTo    *int32            `json:"assignTo"`
	AccountType *sqlc.AccountType `json:"accountType" validate:"omitempty,oneof=CUSTOMER_COMPANY EMPLOYEE UNSPECIFIED"`
}

func (r UpdateUserRequest) ValidateBusinessLogic() error {
	if r.AccountType == nil {
		return nil
	}

	switch *r.AccountType {
	case sqlc.AccountTypeEMPLOYEE, sqlc.AccountTypeCUSTOMERCOMPANY:
		if r.AssignTo == nil {
			return ErrAssignToRequired
		}
	default:
	}

	return nil
}
