-- name: ListCompanies :many
SELECT c.id,
       c.name,
       c.tax_id,
       c.main_email,
       c.phone,
       CASE
           WHEN c.at_risk IS TRUE THEN 'AT_RISK'
           WHEN c.is_active IS TRUE THEN 'ACTIVE'
           ELSE 'INACTIVE'
           END::company_status                            AS status,
       c.created_at,
       COUNT(o.id) FILTER (WHERE o.status != 'CANCELLED') AS order_count
FROM customer_company AS c
         LEFT JOIN orders AS o ON (o.customer_id = c.id)
group by c.id;

-- name: GetCompanyDetailsById :one
SELECT c.id,
       c.name,
       c.tax_id,
       c.main_email,
       c.phone,
       CASE
           WHEN c.at_risk IS TRUE THEN 'AT_RISK'
           WHEN c.is_active IS TRUE THEN 'ACTIVE'
           ELSE 'INACTIVE'
           END::company_status                                                          AS status,
       c.created_at,
       count(o.id) FILTER (WHERE o.status != 'CANCELLED')                               AS order_count,
       coalesce(sum(o.total_amount) FILTER (WHERE o.status != 'CANCELLED'), 0)::text AS total_orders_value,
       count(o.id) FILTER (WHERE o.status = 'SHIPPED')                                  AS completed_orders
FROM customer_company AS c
         LEFT JOIN orders AS o ON (o.customer_id = c.id)
WHERE c.id = $1
GROUP BY c.id;