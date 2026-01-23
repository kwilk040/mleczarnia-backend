-- name: InsertOrderItem :one
INSERT INTO order_item(order_id, product_id, quantity, unit_price, line_total)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
