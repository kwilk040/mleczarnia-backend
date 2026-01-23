package employees

import (
	"mleczarnia/internal/db/sqlc"
	app "mleczarnia/internal/http"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func Router(handler *Handler, middleware *app.Middleware) http.Handler {
	router := chi.NewRouter()

	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireRole(sqlc.RoleADMIN))
		r.Get("/", handler.ListEmployees)
		r.Post("/", handler.CreateEmployee)
		r.Get("/{employeeId}", handler.GetEmployee)
		r.Patch("/{employeeId}", handler.UpdateEmployee)
	})

	return router
}
