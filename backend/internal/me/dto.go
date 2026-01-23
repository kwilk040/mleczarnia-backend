package me

import "time"

type GetProfileResponse struct {
	Email             string     `json:"email"`
	Role              string     `json:"role"`
	LastLoginAt       *time.Time `json:"lastLoginAt"`
	CustomerCompanyId *int32     `json:"customerCompanyId"`
	EmployeeId        *int32     `json:"employeeId"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" validate:"required"`
	NewPassword     string `json:"newPassword" validate:"required"`
}

type ChangePasswordResponse struct {
	Message string `json:"message"`
}
