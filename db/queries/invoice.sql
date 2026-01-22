-- name: ListInvoices :many
SELECT i.id,
       i.invoice_number,
       i.issue_date,
       i.due_date,
       i.total_amount::text AS total_amount,
       i.status,
       o.id                 AS order_id,
       c.name               AS company_name
FROM invoice i
         JOIN orders o ON o.id = i.order_id
         JOIN customer_company c ON c.id = o.customer_id
ORDER BY i.issue_date DESC;

-- name: ListInvoicesForCompany :many
SELECT i.id,
       i.invoice_number,
       i.issue_date,
       i.due_date,
       i.total_amount::text AS total_amount,
       i.status,
       o.id                 AS order_id
FROM invoice i
         JOIN orders o ON o.id = i.order_id
WHERE o.customer_id = $1
ORDER BY i.issue_date DESC;

-- name: GetInvoiceById :one
SELECT *
FROM invoice
WHERE id = $1;

-- name: GetInvoiceWithOrder :one
SELECT i.*,
       i.total_amount::text AS total_amount_str,
       o.order_number,
       o.order_date,
       c.name               AS company_name,
       c.tax_id,
       c.main_email,
       c.id                 AS customer_id
FROM invoice i
         JOIN orders o ON o.id = i.order_id
         JOIN customer_company c ON c.id = o.customer_id
WHERE i.id = $1;

-- name: GetInvoiceItems :many
SELECT oi.quantity,
       oi.unit_price::text AS unit_price,
       oi.line_total::text AS line_total,
       p.name              AS product_name,
       p.unit
FROM order_item oi
         JOIN product p ON p.id = oi.product_id
WHERE oi.order_id = $1;

-- name: CreateInvoice :one
INSERT INTO invoice (order_id,
                     issue_date,
                     due_date,
                     total_amount,
                     status)
VALUES ($1, $2,  $3, $4, 'UNPAID')
RETURNING *;

-- name: UpdateInvoiceStatus :one
UPDATE invoice
SET status = $2
WHERE id = $1
RETURNING *;

-- name: InvoiceExistsForOrder :one
SELECT EXISTS (SELECT 1
               FROM invoice
               WHERE order_id = $1);
