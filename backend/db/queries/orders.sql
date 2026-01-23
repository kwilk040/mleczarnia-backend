-- name: CreateOrder :one
INSERT INTO orders(customer_id)
VALUES ($1)
RETURNING *;

-- name: SetOrderTotalAmount :one
UPDATE orders
SET total_amount = $1
WHERE id = $2
RETURNING *;

-- name: ListOrders :many
SELECT id, order_number, status, total_amount::text, order_date
FROM orders
ORDER BY order_date DESC;

-- name: ListOrdersByCustomer :many
SELECT id, order_number, status, total_amount::text, order_date
FROM orders
WHERE customer_id = $1
ORDER BY order_date DESC;

-- name: GetOrderById :one
SELECT id, order_number, customer_id, status, total_amount::text, order_date
FROM orders
WHERE id = $1;

-- name: GetOrderItems :many
SELECT oi.id,
       oi.product_id,
       p.name              AS product_name,
       oi.quantity,
       oi.unit_price::text AS unit_price,
       oi.line_total::text AS line_total
FROM order_item oi
         JOIN product p ON oi.product_id = p.id
WHERE oi.order_id = $1;

-- name: UpdateOrderStatus :exec
UPDATE orders
SET status = $2
WHERE id = $1;
