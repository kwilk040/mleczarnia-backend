-- name: ListUsers :many
SELECT u.Id,
       CASE
           WHEN e.id IS NOT NULL THEN concat_ws(' ', e.first_name, e.last_name)
           WHEN c.id IS NOT NULL THEN c.name
           ELSE ''
           END               AS name,
       u.email,
       u.role,
       CASE
           WHEN e.id IS NOT NULL THEN 'EMPLOYEE'
           WHEN c.id IS NOT NULL THEN 'CUSTOMER_COMPANY'
           ELSE 'UNSPECIFIED'
           END::account_type as account_type,
       CASE
           WHEN u.is_blocked IS TRUE THEN 'BLOCKED'
           WHEN u.is_active IS TRUE THEN 'ACTIVE'
           ELSE 'INACTIVE'
           END::user_status  AS status,
       u.last_login_at
FROM user_account AS u
         LEFT JOIN employee AS e
                   ON (u.employee_id = e.id)
         LEFT JOIN customer_company AS c ON (u.customer_company_id = c.id);

-- name: GetUserWithDetailsById :one
SELECT u.Id,
       CASE
           WHEN e.id IS NOT NULL THEN concat_ws(' ', e.first_name, e.last_name)
           WHEN c.id IS NOT NULL THEN c.name
           ELSE ''
           END               AS name,
       u.email,
       u.role,
       CASE
           WHEN e.id IS NOT NULL THEN 'EMPLOYEE'
           WHEN c.id IS NOT NULL THEN 'CUSTOMER_COMPANY'
           ELSE 'UNSPECIFIED'
           END::account_type as account_type,
       CASE
           WHEN u.is_blocked IS TRUE THEN 'BLOCKED'
           WHEN u.is_active IS TRUE THEN 'ACTIVE'
           ELSE 'INACTIVE'
           END::user_status  AS status,
       u.last_login_at
FROM user_account AS u
         LEFT JOIN employee AS e
                   ON (u.employee_id = e.id)
         LEFT JOIN customer_company AS c ON (u.customer_company_id = c.id)
WHERE u.id = $1;

