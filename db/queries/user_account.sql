-- name: CreateUser :one
INSERT INTO user_account (email, password_hash, role)
VALUES ($1, $2, $3)
RETURNING *;

-- name: CreateUserForCompany :one
INSERT INTO user_account (email, password_hash, role, customer_company_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: CreateUserForEmployee :one
INSERT INTO user_account (email, password_hash, role, employee_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByEmail :one
SELECT *
FROM user_account
WHERE email = $1
  AND is_active = true;

-- name: GetUserByID :one
SELECT *
FROM user_account
WHERE id = $1;

-- name: IsUserBlocked :one
SELECT is_blocked
FROM user_account
WHERE id = $1;

-- name: BlockUser :one
UPDATE user_account
SET is_blocked = true
WHERE id = $1
RETURNING *;

-- name: UnblockUser :one
UPDATE user_account
SET is_blocked = false
WHERE id = $1
RETURNING *;

-- name: UpdateLastLogin :exec
UPDATE user_account
SET last_login_at = now()
WHERE id = $1;

-- name: UpdatePassword :exec
UPDATE user_account
SET password_hash       = $2,
    password_changed_at = now()
WHERE id = $1;


-- name: UpdateUser :one
UPDATE user_account
SET email               = coalesce(sqlc.narg(email), email),
    role                = coalesce(sqlc.narg(role), role),
    employee_id         = CASE
                              WHEN sqlc.narg(account_type)::account_type = 'EMPLOYEE' THEN sqlc.narg(assign_to)
                              WHEN sqlc.narg(account_type)::account_type IS NOT NULL THEN NULL
                              ELSE employee_id
        END,
    customer_company_id = CASE
                              WHEN sqlc.narg(account_type)::account_type = 'CUSTOMER_COMPANY' THEN sqlc.narg(assign_to)
                              WHEN sqlc.narg(account_type)::account_type IS NOT NULL THEN NULL
                              ELSE customer_company_id
        END
WHERE id = sqlc.arg(id)
RETURNING *;