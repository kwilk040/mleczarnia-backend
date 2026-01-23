package movements

import (
	"mleczarnia/internal/db/sqlc"
	app "mleczarnia/internal/http"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func Router(
	movementsHandler *Handler,
	middleware *app.Middleware) http.Handler {
	router := chi.NewRouter()

	router.Use(middleware.RequireRole(sqlc.RoleADMIN, sqlc.RoleWAREHOUSE))
	router.Use(middleware.CheckBlockStatus())

	router.Get("/", movementsHandler.ListMovements)
	router.Post("/inbound", movementsHandler.Inbound)
	router.Post("/dispatch", movementsHandler.Dispatch)
	router.Post("/return", movementsHandler.Return)
	router.Post("/loss", movementsHandler.Loss)

	return router
}
