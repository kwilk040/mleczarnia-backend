package main

import (
	"context"
	"log"
	"mleczania/config"
	"mleczania/internal/auth"
	"mleczania/internal/db"
	"mleczania/internal/db/sqlc"
	app "mleczania/internal/http"
	"mleczania/internal/jwt"
	"mleczania/internal/me"
	"mleczania/internal/users"
	"net/http"

	"github.com/sirupsen/logrus"
)

func main() {
	ctx := context.Background()
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}

	pool, err := db.New(ctx, cfg.DBUrl)
	if err != nil {
		log.Fatal(err)
	}

	queries := sqlc.New(pool)

	jwtService := jwt.NewService(cfg.JWTSecret)

	middleware := app.NewMiddleware(jwtService, queries)

	authService := auth.NewService(queries,
		jwtService, pool)
	authHandler := auth.NewHandler(authService)
	authRouter := auth.Router(authHandler)

	meService := me.NewService(queries, pool)
	meHandler := me.NewHandler(meService)
	meRouter := me.Router(meHandler, middleware)

	usersService := users.NewService(queries, pool)
	userHandler := users.NewHandler(usersService)
	usersRouter := users.Router(userHandler, middleware)

	if err := seedAdmin(ctx, usersService, queries); err != nil {
		logrus.WithError(err).Fatal("failed to seed admin")
	}

	r := app.Router(authRouter, meRouter, usersRouter)
	log.Fatal(http.ListenAndServe(":8080", r))

}

func seedAdmin(ctx context.Context, service *users.Service, queries *sqlc.Queries) error {
	const adminEmail = "admin@mleczarnia.dev"
	const adminPassword = "admin"

	_, err := queries.GetUserByEmail(ctx, adminEmail)
	if err == nil {
		logrus.Info("Admin user already exists")
		return nil
	}

	if err := service.CreateUser(ctx, users.CreateUserRequest{
		Email:       adminEmail,
		Password:    adminPassword,
		Role:        sqlc.RoleADMIN,
		AccountType: sqlc.AccountTypeUNSPECIFIED,
	}); err != nil {
		return err
	}

	logrus.WithFields(logrus.Fields{
		"email":    adminEmail,
		"password": adminPassword,
	}).Info("Admin user created")

	return nil
}
