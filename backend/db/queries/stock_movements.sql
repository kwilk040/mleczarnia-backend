-- name: ListStockMovements :many
SELECT *
FROM stock_movement
ORDER BY created_at DESC;

-- name: GetStockForUpdate :one
SELECT *
FROM stock
WHERE product_id = $1
    FOR UPDATE;

-- name: UpdateStockQuantity :exec
UPDATE stock
SET quantity = $2
WHERE product_id = $1;

-- name: CreateStockMovement :one
INSERT INTO stock_movement (
    product_id,
    quantity_change,
    movement_type,
    related_order_id,
    reason,
    employee_id
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
