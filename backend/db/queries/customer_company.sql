-- name: CreateCustomerCompany :one
INSERT INTO customer_company (name, tax_id, main_email, phone)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetCustomerCompanyById :one
SELECT *
FROM customer_company
WHERE id = $1;

-- name: ActivateCompany :one
UPDATE customer_company
SET is_active = true
WHERE id = $1
RETURNING *;

-- name: DeactivateCompany :one
UPDATE customer_company
SET is_active = false
WHERE id = $1
RETURNING *;

-- name: UpdateCompany :one
UPDATE customer_company
SET name       = coalesce(sqlc.narg(name), name),
    tax_id     = coalesce(sqlc.narg(tax_id), tax_id),
    main_email = coalesce(sqlc.narg(main_email), main_email),
    phone      = coalesce(sqlc.narg(phone), phone)
WHERE id = sqlc.arg(id)
RETURNING *;