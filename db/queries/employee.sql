-- name: ListEmployees :many
SELECT id, first_name, last_name, position, is_active, hire_date
FROM employee
ORDER BY last_name, first_name;

-- name: GetEmployeeById :one
SELECT id, first_name, last_name, position, is_active, hire_date
FROM employee
WHERE id = $1;

-- name: CreateEmployee :one
INSERT INTO employee (first_name, last_name, position, hire_date)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateEmployee :one
UPDATE employee
SET first_name = coalesce(sqlc.narg(first_name), first_name),
    last_name  = coalesce(sqlc.narg(last_name), last_name),
    position   = coalesce(sqlc.narg(position), position),
    is_active  = coalesce(sqlc.narg(is_active), is_active),
    hire_date  = coalesce(sqlc.narg(hire_date), hire_date)
WHERE id = sqlc.arg(id)
RETURNING *;
