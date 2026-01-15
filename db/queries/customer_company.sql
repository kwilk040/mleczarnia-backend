-- name: CreateCustomerCompany :one
INSERT INTO customer_company (name, tax_id, main_email, phone)
VALUES ($1, $2, $3, $4)
RETURNING *;
