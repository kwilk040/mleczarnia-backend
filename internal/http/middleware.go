package http

import (
	"context"
	"mleczania/internal/db/sqlc"
	"mleczania/internal/jwt"
	"net/http"
	"strings"
)

type ctxKey string

const UserCtxKey ctxKey = "UserId"

type Middleware struct {
	tokenService *jwt.Service
	queries      *sqlc.Queries
}

func NewMiddleware(tokenService *jwt.Service, queries *sqlc.Queries) *Middleware {
	return &Middleware{
		tokenService: tokenService,
		queries:      queries,
	}
}

func (middleware *Middleware) RequireAuth() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			claims, err := middleware.extractAndValidateToken(request)
			if err != nil {
				http.Error(writer, "unauthorized", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(request.Context(), UserCtxKey, claims)
			next.ServeHTTP(writer, request.WithContext(ctx))
		})
	}
}

func (middleware *Middleware) RequireAdmin() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			claims, err := middleware.extractAndValidateToken(request)
			if err != nil {
				http.Error(writer, "unauthorized", http.StatusUnauthorized)
				return
			}

			if claims.Role != string(sqlc.RoleADMIN) {
				http.Error(writer, "forbidden", http.StatusForbidden)
				return
			}

			ctx := context.WithValue(request.Context(), UserCtxKey, claims)
			next.ServeHTTP(writer, request.WithContext(ctx))
		})
	}
}

func (middleware *Middleware) CheckBlockStatus() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			claims, ok := request.Context().Value(UserCtxKey).(*jwt.Claims)
			if !ok {
				http.Error(writer, "unauthorized", http.StatusUnauthorized)
				return
			}

			blocked, err := middleware.queries.IsUserBlocked(request.Context(), int32(claims.UserId))
			if err != nil {
				http.Error(writer, "internal server error", http.StatusInternalServerError)
				return
			}

			if blocked {
				http.Error(writer, "account is blocked", http.StatusForbidden)
				return
			}

			next.ServeHTTP(writer, request)
		})
	}
}

func (middleware *Middleware) extractAndValidateToken(r *http.Request) (*jwt.Claims, error) {
	tokenString, err := extractBearerToken(r)
	if err != nil {
		return nil, err
	}

	claims, err := middleware.tokenService.ParseToken(tokenString)
	if err != nil {
		return nil, err
	}

	return claims, nil
}

func extractBearerToken(r *http.Request) (string, error) {
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return "", jwt.ErrInvalidToken
	}

	return strings.TrimPrefix(header, "Bearer "), nil
}
