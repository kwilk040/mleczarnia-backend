package crypto

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrPasswordHash    = errors.New("failed to hash password")
	ErrInvalidPassword = errors.New("invalid password")
	ErrSamePassword    = errors.New("same password")
)

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return "", ErrPasswordHash
	}
	return string(hash), nil
}

func CheckPassword(hash, password string) error {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		return ErrInvalidPassword
	}
	return nil
}
