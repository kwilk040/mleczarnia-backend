package http

import (
	"mleczania/internal/auth"
	"mleczania/internal/me"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

const timeout = 1 * time.Minute

func Router(authHandler *auth.Handler, meHandler *me.Handler, jwtSecret []byte) *chi.Mux {
	router := chi.NewRouter()

	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(timeout))

	router.Route("/api/v1", func(router chi.Router) {

		router.Route("/auth", func(router chi.Router) {
			router.Post("/login", authHandler.Login)
			router.Post("/register-company", authHandler.RegisterCompany)
			router.Post("/refresh-token", authHandler.RefreshToken)
			router.Post("/logout", authHandler.Logout)
		})

		router.Group(func(router chi.Router) {
			router.Use(auth.Middleware(jwtSecret))

			router.Route("/me", func(r chi.Router) {
				r.Get("/", meHandler.GetProfile)
				r.Patch("/change-password", meHandler.ChangePassword)
			})
		})

		router.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		})
	})

	return router
}
