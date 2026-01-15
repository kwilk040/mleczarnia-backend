-- name: CreateUser :one
INSERT INTO user_account (email, password_hash, role)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserByEmail :one
SELECT *
FROM user_account
WHERE email = $1
  AND is_active = true;

-- name: GetUserByID :one
SELECT *
FROM user_account
WHERE id = $1
  AND is_active = true;

-- name: UpdateLastLogin :exec
UPDATE user_account
SET last_login_at = now()
WHERE id = $1;

-- name: UpdatePassword :exec
UPDATE user_account
SET password_hash       = $2,
    password_changed_at = now()
WHERE id = $1;
