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
	"mleczarnia/internal/employees"
	app "mleczarnia/internal/http"
	"mleczarnia/internal/invoices"
	"mleczarnia/internal/jwt"
	"mleczarnia/internal/me"
	"mleczarnia/internal/orders"
	"mleczarnia/internal/products"
	"mleczarnia/internal/users"
	"mleczarnia/internal/warehouse"
	"mleczarnia/internal/warehouse/movements"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
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

	invoicesService := invoices.NewService(queries, pool)
	invoicesHandler := invoices.NewHandler(invoicesService)
	invoicesRouter := invoices.Router(invoicesHandler, middleware)

	ordersService := orders.NewService(queries, pool)
	ordersHandler := orders.NewHandler(ordersService)
	ordersRouter := orders.Router(ordersHandler, invoicesHandler, middleware)

	employeesService := employees.NewService(queries)
	employeesHandler := employees.NewHandler(employeesService)
	employeesRouter := employees.Router(employeesHandler, middleware)

	if err := seedAdmin(ctx, usersService, queries); err != nil {
		logrus.WithError(err).Fatal("failed to seed admin")
	}

	if err := seedStaff(ctx, usersService, queries); err != nil {
		logrus.WithError(err).Fatal("failed to seed staff")
	}

	if err := seedWarehouse(ctx, usersService, queries); err != nil {
		logrus.WithError(err).Fatal("failed to seed warehouse")
	}

	if err := seedCompany(ctx, usersService, queries); err != nil {
		logrus.WithError(err).Fatal("failed to seed company")
	}

	r := app.Router(authRouter, meRouter, usersRouter, companiesRouter, productsRouter, warehouseRouter, ordersRouter, invoicesRouter, employeesRouter)
	log.Fatal(http.ListenAndServe(":8080", r))

}

func seedAdmin(ctx context.Context, service *users.Service, queries *sqlc.Queries) error {
	email := "admin@mleczarnia.dev"
	password := "admin"

	_, err := queries.GetUserByEmail(ctx, email)
	if err == nil {
		logrus.Info("User already exists")
		return nil
	}

	if err := service.CreateUser(ctx, users.CreateUserRequest{
		Email:       email,
		Password:    password,
		Role:        sqlc.RoleADMIN,
		AccountType: sqlc.AccountTypeUNSPECIFIED,
	}); err != nil {
		return err
	}

	logrus.WithFields(logrus.Fields{
		"email":    email,
		"password": password,
	}).Info("Admin user created")

	return nil
}

func seedStaff(ctx context.Context, service *users.Service, queries *sqlc.Queries) error {
	email := "staff@mleczarnia.dev"
	password := "staff123"

	_, err := queries.GetUserByEmail(ctx, email)
	if err == nil {
		logrus.Info("User already exists")
		return nil
	}

	staffEmployee, err := queries.CreateEmployee(ctx, sqlc.CreateEmployeeParams{
		FirstName: "Anna",
		LastName:  "Nowak",
		Position:  "Księgowa",
		HireDate:  pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})
	if err != nil {
		return err
	}

	if err := service.CreateUser(ctx, users.CreateUserRequest{
		Email:       email,
		Password:    password,
		Role:        sqlc.RoleSTAFF,
		AccountType: sqlc.AccountTypeEMPLOYEE,
		AssignTo:    staffEmployee.ID,
	}); err != nil {
		return err
	}

	logrus.WithFields(logrus.Fields{
		"email":    email,
		"password": password,
	}).Info("Staff user created")

	return nil
}

func seedWarehouse(ctx context.Context, service *users.Service, queries *sqlc.Queries) error {
	email := "warehouse@mleczarnia.dev"
	password := "warehouse123"

	_, err := queries.GetUserByEmail(ctx, email)
	if err == nil {
		logrus.Info("User already exists")
		return nil
	}

	warehouseEmployee, err := queries.CreateEmployee(ctx, sqlc.CreateEmployeeParams{
		FirstName: "Piotr",
		LastName:  "Wiśniewski",
		Position:  "Magazynier",
		HireDate:  pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})
	if err != nil {
		return err
	}

	if err := service.CreateUser(ctx, users.CreateUserRequest{
		Email:       email,
		Password:    password,
		Role:        sqlc.RoleWAREHOUSE,
		AccountType: sqlc.AccountTypeEMPLOYEE,
		AssignTo:    warehouseEmployee.ID,
	}); err != nil {
		return err
	}

	logrus.WithFields(logrus.Fields{
		"email":    email,
		"password": password,
	}).Info("Warehouse user created")

	return nil
}

func seedCompany(ctx context.Context, service *users.Service, queries *sqlc.Queries) error {
	email := "client@mleczarnia.dev"
	password := "client123"

	_, err := queries.GetUserByEmail(ctx, email)
	if err == nil {
		logrus.Info("User already exists")
		return nil
	}

	company, err := queries.CreateCustomerCompany(ctx, sqlc.CreateCustomerCompanyParams{
		Name:      "Delikatesy Świeżość Sp. z o.o.",
		TaxID:     "1234567890",
		MainEmail: "kontakt@swiezosc.pl",
		Phone:     pgtype.Text{String: "48123456789", Valid: true},
	})
	if err != nil {
		return err
	}

	if err := service.CreateUser(ctx, users.CreateUserRequest{
		Email:       email,
		Password:    password,
		Role:        sqlc.RoleCLIENT,
		AccountType: sqlc.AccountTypeCUSTOMERCOMPANY,
		AssignTo:    company.ID,
	}); err != nil {
		return err
	}

	logrus.WithFields(logrus.Fields{
		"email":    email,
		"password": password,
	}).Info("Client user created")

	return nil
}
