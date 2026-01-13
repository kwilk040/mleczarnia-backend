-- name: CreateRefreshToken :one
INSERT INTO refresh_token (user_id, token, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetRefreshToken :one
SELECT *
FROM refresh_token
WHERE token = $1
  AND revoked = false
  AND expires_at > now();

-- name: RevokeRefreshToken :exec
UPDATE refresh_token
SET revoked = true
WHERE token = $1;

-- name: RevokeAllUserTokens :exec
UPDATE refresh_token
SET revoked = true
WHERE user_id = $1
  AND revoked = false;
