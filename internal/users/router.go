package users

import (
	"mleczarnia/internal/db/sqlc"
	app "mleczarnia/internal/http"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func Router(
	usersHandler *Handler,
	authMiddleware *app.Middleware) http.Handler {
	router := chi.NewRouter()

	router.Use(authMiddleware.RequireRole(sqlc.RoleADMIN))
	router.Use(authMiddleware.CheckBlockStatus())

	router.Get("/", usersHandler.ListUsers)
	router.Post("/", usersHandler.CreateUser)
	router.Get("/{userId}", usersHandler.GetUserDetails)
	router.Patch("/{userId}", usersHandler.UpdateUser)
	router.Patch("/{userId}/block", usersHandler.BlockUser)
	router.Patch("/{userId}/unblock", usersHandler.UnblockUser)

	return router
}
