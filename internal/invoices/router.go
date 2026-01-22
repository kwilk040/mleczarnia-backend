package invoices

import (
	"mleczarnia/internal/db/sqlc"
	app "mleczarnia/internal/http"

	"github.com/go-chi/chi/v5"
)

func Router(handler *Handler, middleware *app.Middleware) *chi.Mux {
	router := chi.NewRouter()

	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireRole(sqlc.RoleADMIN, sqlc.RoleSTAFF, sqlc.RoleCLIENT))
		r.Get("/", handler.ListInvoices)
		r.Get("/{invoiceId}", handler.GetInvoiceById)
		r.Get("/{invoiceId}/pdf", handler.GetInvoicePdf)
	})

	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireRole(sqlc.RoleADMIN, sqlc.RoleSTAFF))
		r.Patch("/{invoiceId}/status", handler.UpdateStatus)
	})

	return router
}
