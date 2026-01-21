package main

import (
	"context"
	"log"
	"mleczarnia/config"
	"mleczarnia/internal/auth"
	"mleczarnia/internal/companies"
	"mleczarnia/internal/companies/addresses"
	"mleczarnia/internal/db"
	"mleczarnia/internal/db/sqlc"
	app "mleczarnia/internal/http"
	"mleczarnia/internal/jwt"
	"mleczarnia/internal/me"
	"mleczarnia/internal/products"
	"mleczarnia/internal/users"
	"mleczarnia/internal/warehouse"
	"mleczarnia/internal/warehouse/movements"
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

	authService := auth.NewService(queries, jwtService, pool)
	authHandler := auth.NewHandler(authService)
	authRouter := auth.Router(authHandler)

	meService := me.NewService(queries, pool)
	meHandler := me.NewHandler(meService)
	meRouter := me.Router(meHandler, middleware)

	usersService := users.NewService(queries, pool)
	userHandler := users.NewHandler(usersService)
	usersRouter := users.Router(userHandler, middleware)

	addressesService := addresses.NewService(queries, pool)
	addressHandler := addresses.NewHandler(addressesService)
	addressesRouter := addresses.Router(addressHandler, middleware)

	companiesService := companies.NewService(queries, pool)
	companiesHandler := companies.NewHandler(companiesService)
	companiesRouter := companies.Router(companiesHandler, middleware, addressesRouter)

	productsService := products.NewService(queries)
	productHandler := products.NewHandler(productsService)
	productsRouter := products.Router(productHandler, middleware)

	movementsService := movements.NewService(queries, pool)
	movementsHandler := movements.NewHandler(movementsService)
	movementsRouter := movements.Router(movementsHandler, middleware)

	warehouseService := warehouse.NewService(queries)
	warehouseHandler := warehouse.NewHandler(warehouseService)
	warehouseRouter := warehouse.Router(warehouseHandler, middleware, movementsRouter)

	if err := seedAdmin(ctx, usersService, queries); err != nil {
		logrus.WithError(err).Fatal("failed to seed admin")
	}

	r := app.Router(authRouter, meRouter, usersRouter, companiesRouter, productsRouter, warehouseRouter)
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
