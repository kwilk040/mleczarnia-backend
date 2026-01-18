package addresses

import (
	"mleczania/internal/db/sqlc"
	app "mleczania/internal/http"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func Router(addressesHandler *Handler,
	middleware *app.Middleware) http.Handler {
	router := chi.NewRouter()
	router.Use(middleware.RequireRoleOrCompanyOwner("companyId", sqlc.RoleADMIN, sqlc.RoleSTAFF))

	router.Get("/", addressesHandler.ListAddresses)
	router.Post("/", addressesHandler.CreateAddress)
	router.Patch("/{addressId}", addressesHandler.UpdateAddress)

	return router
}
