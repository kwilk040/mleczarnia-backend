CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE role AS ENUM ('ADMIN', 'STAFF', 'WAREHOUSE', 'CLIENT');

CREATE TABLE user_account
(
    id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email               VARCHAR(200) NOT NULL UNIQUE,
    password_hash       TEXT         NOT NULL,
    role                role         NOT NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ  NULL,
    customer_company_id INT          NULL,
    employee_id         INT          NULL,
    password_changed_at TIMESTAMPTZ  NULL
);

CREATE TABLE refresh_token
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id    INT         NOT NULL REFERENCES user_account (id) ON DELETE CASCADE,
    token      TEXT        NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN     NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
