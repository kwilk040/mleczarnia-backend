-- name: ListStock :many
SELECT s.product_id,
       p.name                                                                   AS product_name,
       p.category,
       s.quantity,
       s.min_quantity,
       coalesce(count(m.id) FILTER (WHERE m.movement_type = 'LOSS'), 0)::int4   AS damaged_count,
       coalesce(count(m.id) FILTER (WHERE m.movement_type = 'RETURN'), 0)::int4 AS return_count
FROM stock s
         JOIN product p ON p.id = s.product_id
         LEFT JOIN stock_movement m ON m.product_id = p.id
GROUP BY s.product_id, p.name, p.category, s.quantity, s.min_quantity
ORDER BY p.name;

-- name: GetStockByProductId :one
SELECT s.product_id,
       p.name                                                                   AS product_name,
       s.quantity,
       p.category,
       s.min_quantity,
       coalesce(count(m.id) FILTER (WHERE m.movement_type = 'LOSS'), 0)::int4   AS damaged_count,
       coalesce(count(m.id) FILTER (WHERE m.movement_type = 'RETURN'), 0)::int4 AS return_count
FROM stock s
         JOIN product p ON p.id = s.product_id
         LEFT JOIN stock_movement m ON m.product_id = p.id
WHERE s.product_id = $1
GROUP BY s.product_id, p.name, p.category, s.quantity, s.min_quantity;

-- name: CreateStock :one
INSERT INTO stock (product_id, quantity, min_quantity)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateStockByProductId :one
UPDATE stock
SET min_quantity = $1
WHERE product_id = $2
RETURNING *;
