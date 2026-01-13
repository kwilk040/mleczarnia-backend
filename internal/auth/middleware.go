package auth

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

const UserCtxKey ctxKey = "UserID"

func Middleware(secret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			header := request.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				http.Error(writer, "unauthorized", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(header, "Bearer ")
			token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return secret, nil
			})

			if err != nil || !token.Valid {
				http.Error(writer, "unauthorized", http.StatusUnauthorized)
				return
			}

			claims := token.Claims.(*Claims)
			ctx := context.WithValue(request.Context(), UserCtxKey, claims)
			next.ServeHTTP(writer, request.WithContext(ctx))
		})
	}
}
