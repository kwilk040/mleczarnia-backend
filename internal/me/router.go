package me

import (
	app "mleczania/internal/http"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func Router(
	meHandler *Handler, middleware *app.Middleware) http.Handler {
	router := chi.NewRouter()

	router.Use(middleware.RequireAuth())
	router.Use(middleware.CheckBlockStatus())

	router.Get("/", meHandler.GetProfile)
	router.Patch("/change-password", meHandler.ChangePassword)

	return router
}
