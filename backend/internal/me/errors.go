package me

import "errors"

var (
	ErrPasswordUpdateFailed = errors.New("failed to update password")
	ErrAllTokenRevokeFailed = errors.New("failed to revoke tokens")
)
