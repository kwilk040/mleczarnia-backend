package main

import (
	"context"
	"log"
	"mleczania/config"
	"mleczania/internal/auth"
	"mleczania/internal/db"
	"mleczania/internal/db/sqlc"
	app "mleczania/internal/http"
	"mleczania/internal/me"
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

	authService := auth.NewService(queries,
		cfg.JWTSecret, pool)
	authHandler := auth.NewHandler(authService)

	meService := me.NewService(queries, pool)
	meHandler := me.NewHandler(meService)

	if err := seedAdmin(ctx, authService, queries); err != nil {
		logrus.WithError(err).Fatal("failed to seed admin")
	}

	r := app.Router(authHandler, meHandler, cfg.JWTSecret)
	log.Fatal(http.ListenAndServe(":8080", r))

}

func seedAdmin(ctx context.Context, service *auth.Service, queries *sqlc.Queries) error {
	const adminEmail = "admin@mleczarnia.dev"
	const adminPassword = "admin"

	_, err := queries.GetUserByEmail(ctx, adminEmail)
	if err == nil {
		logrus.Info("Admin user already exists")
		return nil
	}

	if err := service.Register(ctx, adminEmail, adminPassword, sqlc.RoleADMIN); err != nil {
		return err
	}

	logrus.WithFields(logrus.Fields{
		"email":    adminEmail,
		"password": adminPassword,
	}).Info("Admin user created")
	return nil
}
