-- name: ListProducts :many
SELECT p.*,
       p.default_price::text                                                    AS default_price_text,
       coalesce(s.quantity, 0),
       coalesce(s.min_quantity, 0),
       coalesce(count(m.id) FILTER (WHERE m.movement_type = 'LOSS'), 0)::int4   AS damaged_count,
       coalesce(count(m.id) FILTER (WHERE m.movement_type = 'RETURN'), 0)::int4 AS return_count
FROM product p
         LEFT JOIN stock s ON p.id = s.product_id
         LEFT JOIN stock_movement m ON p.id = m.product_id
GROUP BY p.id, p.name, s.quantity, s.min_quantity
ORDER BY p.name;

-- name: GetProductById :one
SELECT p.*,
       p.default_price::text                                                    AS default_price_text,
       coalesce(s.quantity, 0),
       coalesce(s.min_quantity, 0),
       coalesce(count(m.id) FILTER (WHERE m.movement_type = 'LOSS'), 0)::int4   AS damaged_count,
       coalesce(count(m.id) FILTER (WHERE m.movement_type = 'RETURN'), 0)::int4 AS return_count
FROM product p
         LEFT JOIN stock s ON p.id = s.product_id
         LEFT JOIN stock_movement m ON p.id = m.product_id
WHERE p.id = $1
GROUP BY p.id, p.name, s.quantity, s.min_quantity
ORDER BY p.name;

-- name: CreateProduct :one
INSERT INTO product (name, category, unit, default_price)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateProduct :one
UPDATE product
SET name          = COALESCE(sqlc.narg(name), name),
    category      = COALESCE(sqlc.narg(category), category),
    unit          = COALESCE(sqlc.narg(unit), unit),
    default_price = COALESCE(sqlc.narg(default_price), default_price)
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: ActivateProduct :one
UPDATE product
SET is_active = true
WHERE id = $1
RETURNING *;

-- name: DeactivateProduct :one
UPDATE product
SET is_active = false
WHERE id = $1
RETURNING *;
