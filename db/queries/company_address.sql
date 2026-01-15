-- name: CreateCompanyAddress :one
INSERT INTO company_address (customer_company_id, address_line, city, postal_code, country, type)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
