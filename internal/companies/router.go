package companies

import (
	"mleczania/internal/db/sqlc"
	app "mleczania/internal/http"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func Router(companiesHandler *Handler,
	middleware *app.Middleware,
	addressesRouter http.Handler) http.Handler {
	router := chi.NewRouter()

	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireRole(sqlc.RoleADMIN, sqlc.RoleSTAFF))
		r.Get("/", companiesHandler.ListCompanies)
		r.Patch("/{companyId}", companiesHandler.UpdateCompany)
	})

	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireRoleOrCompanyOwner("companyId", sqlc.RoleADMIN, sqlc.RoleSTAFF))
		r.Get("/{companyId}", companiesHandler.GetCompanyDetails)
	})

	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireRole(sqlc.RoleADMIN))

		r.Patch("/{companyId}/activate", companiesHandler.ActivateCompany)
		r.Patch("/{companyId}/deactivate", companiesHandler.DeactivateCompany)
	})

	router.Mount("/{companyId}/addresses", addressesRouter)

	return router
}
