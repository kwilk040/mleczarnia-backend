package config

import (
	"errors"
	"os"
)

type Config struct {
	JWTSecret []byte
	DBUrl     string
}

func Load() (*Config, error) {
	var cfg Config

	if v, ok := os.LookupEnv("JWT_SECRET"); ok && v != "" {
		cfg.JWTSecret = []byte(v)
	} else {
		return nil, errors.New("JWT_SECRET environment must be set")
	}

	if v, ok := os.LookupEnv("DATABASE_URL"); ok && v != "" {
		cfg.DBUrl = v
	} else {
		return nil, errors.New("DATABASE_URL environment must be set")
	}

	return &cfg, nil
}
