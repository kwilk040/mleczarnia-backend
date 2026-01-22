package orders

import (
	"mleczarnia/internal/db/sqlc"
	app "mleczarnia/internal/http"
	"mleczarnia/internal/invoices"

	"github.com/go-chi/chi/v5"
)

func Router(handler *Handler, invoicesHandler *invoices.Handler, middleware *app.Middleware) *chi.Mux {
	router := chi.NewRouter()

	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireRole(sqlc.RoleADMIN, sqlc.RoleSTAFF, sqlc.RoleCLIENT))
		r.Post("/", handler.CreateOrder)
		r.Get("/", handler.ListOrders)
		r.Get("/{orderId}", handler.GetOrder)
		r.Get("/{orderId}/items", handler.GetOrderItems)
	})

	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireRole(sqlc.RoleADMIN, sqlc.RoleSTAFF))
		r.Patch("/{orderId}/status", handler.UpdateStatus)
		r.Post("/{orderId}/invoices", invoicesHandler.CreateInvoiceForOrder)
	})

	return router
}
