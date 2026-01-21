package warehouse

import (
	"mleczarnia/internal/db/sqlc"
	app "mleczarnia/internal/http"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func Router(
	stockHandler *Handler,
	middleware *app.Middleware,
	movementsRouter http.Handler) http.Handler {
	router := chi.NewRouter()

	router.Use(middleware.RequireRole(sqlc.RoleADMIN, sqlc.RoleSTAFF, sqlc.RoleWAREHOUSE))
	router.Use(middleware.CheckBlockStatus())

	router.Get("/", stockHandler.ListStock)
	router.Get("/{productId}", stockHandler.GetStockByProductId)
	router.Patch("/{productId}", stockHandler.UpdateStock)

	router.Mount("/movements", movementsRouter)

	return router
}
