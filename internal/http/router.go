package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

const timeout = 1 * time.Minute

func Router(authRouter http.Handler, meRouter http.Handler, usersRouter http.Handler, companiesRouter http.Handler, productsRouter http.Handler, warehouseRouter http.Handler) *chi.Mux {
	router := chi.NewRouter()

	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(timeout))

	router.Route("/api/v1", func(router chi.Router) {
		router.Mount("/auth", authRouter)
		router.Mount("/me", meRouter)
		router.Mount("/users", usersRouter)
		router.Mount("/companies", companiesRouter)
		router.Mount("/products", productsRouter)
		router.Mount("/warehouse", warehouseRouter)

		router.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		})
	})

	return router
}
