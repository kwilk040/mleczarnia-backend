-- name: CreateCustomerCompany :one
INSERT INTO customer_company (name, tax_id, main_email, phone)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetCustomerCompanyById :one
SELECT *
FROM customer_company
WHERE id = $1;