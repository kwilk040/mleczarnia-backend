-- name: CreateEmployee :one
INSERT INTO employee (first_name, last_name, position, hire_date)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetEmployeeById :one
SELECT *
FROM employee
WHERE id = $1;
