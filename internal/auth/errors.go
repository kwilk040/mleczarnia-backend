package auth

import "errors"

var (
	ErrTokenRevocation     = errors.New("failed to revoke token")
	ErrCompanyRegistration = errors.New("failed to register company")
	ErrAddressCreation     = errors.New("failed to create address")
	ErrUserCreation        = errors.New("failed to create user")
	ErrTokenCreation       = errors.New("failed to create token")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrUserBlocked         = errors.New("user is blocked")
)
