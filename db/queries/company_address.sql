-- name: CreateCompanyAddress :one
INSERT INTO company_address (customer_company_id, address_line, city, postal_code, country, type)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListCompanyAddresses :many
SELECT *
FROM company_address
WHERE customer_company_id = $1;

-- name: UpdateCompanyAddress :one
UPDATE company_address
SET address_line = COALESCE(sqlc.narg(address_line), address_line),
    city         = COALESCE(sqlc.narg(city), city),
    postal_code  = COALESCE(sqlc.narg(postal_code), postal_code),
    country      = COALESCE(sqlc.narg(country), country),
    type         = COALESCE(sqlc.narg(type), type)
WHERE id = sqlc.arg(id)
  AND customer_company_id = sqlc.arg(customer_company_id)
RETURNING *;
