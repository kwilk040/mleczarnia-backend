package auth

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func Router(
	authHandler *Handler) http.Handler {
	router := chi.NewRouter()

	router.Post("/login", authHandler.Login)
	router.Post("/register-company", authHandler.RegisterCompany)
	router.Post("/refresh-token", authHandler.RefreshToken)
	router.Post("/logout", authHandler.Logout)

	return router
}
