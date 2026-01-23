package db

import "errors"

var (
	ErrDatabaseOperation = errors.New("database operation failed")
	ErrTransactionStart  = errors.New("transaction start failed")
	ErrTransactionCommit = errors.New("transaction commit failed")
)
