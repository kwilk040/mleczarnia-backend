package products

import (
	"mleczarnia/internal/db/sqlc"
	app "mleczarnia/internal/http"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func Router(handler *Handler, middleware *app.Middleware) http.Handler {
	r := chi.NewRouter()

	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth())
		r.Get("/", handler.ListProducts)
		r.Get("/{productId}", handler.GetProduct)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireRole(sqlc.RoleADMIN, sqlc.RoleSTAFF))
		r.Post("/", handler.CreateProduct)
		r.Patch("/{productId}", handler.UpdateProduct)
		r.Patch("/{productId}/activate", handler.ActivateProduct)
		r.Patch("/{productId}/deactivate", handler.DeactivateProduct)
	})

	return r
}
