package jwt

import (
	"errors"
	"fmt"
	"mleczarnia/internal/db/sqlc"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken        = errors.New("invalid token")
	ErrExpiredToken        = errors.New("token has expired")
	ErrInvalidSignature    = errors.New("invalid token signature")
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
)

type Claims struct {
	UserId int    `json:"uid"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type Service struct {
	secret []byte
}

func NewService(secret []byte) *Service {
	return &Service{secret: secret}
}
func (service *Service) CreateAccessToken(userID int, role sqlc.Role, duration time.Duration) (string, error) {
	claims := Claims{
		UserId: userID,
		Role:   string(role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(service.secret)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}
	return signedToken, nil
}

func (service *Service) ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("%w: unexpected signing method: %v", ErrInvalidSignature, t.Header["alg"])
		}
		return service.secret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	if !token.Valid {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
