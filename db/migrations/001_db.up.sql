CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE role AS ENUM ('ADMIN', 'STAFF', 'WAREHOUSE', 'CLIENT');

CREATE TYPE account_type AS ENUM ('UNSPECIFIED', 'CUSTOMER_COMPANY', 'EMPLOYEE');

CREATE TYPE address_type AS ENUM ('BILLING', 'SHIPPING');

CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED', 'INACTIVE');

CREATE TYPE company_status AS ENUM ('ACTIVE', 'INACTIVE', 'AT_RISK');

CREATE TYPE order_status AS ENUM ('NEW', 'INVOICED', 'IN_PREPARATION', 'CANCELLED', 'SHIPPED');

CREATE TYPE movement_type AS ENUM ('ADJUSTMENT', 'LOSS', 'RETURN', 'DISPATCH', 'INBOUND');

CREATE TABLE employee
(
    id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    position   VARCHAR(100) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    hire_date  TIMESTAMP    NOT NULL
);

CREATE TABLE customer_company
(
    id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    tax_id     VARCHAR(20)  NOT NULL,
    main_email VARCHAR(200) NOT NULL,
    phone      VARCHAR(50),
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    at_risk    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE company_address
(
    id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_company_id INT          NOT NULL REFERENCES customer_company (id) ON DELETE CASCADE,
    address_line        VARCHAR(255) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    postal_code         VARCHAR(20)  NOT NULL,
    country             VARCHAR(100) NOT NULL,
    type                address_type NOT NULL
);

CREATE TABLE user_account
(
    id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email               VARCHAR(200) NOT NULL UNIQUE,
    password_hash       TEXT         NOT NULL,
    role                role         NOT NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    is_blocked          BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at       TIMESTAMPTZ  NULL,
    customer_company_id INT          NULL REFERENCES customer_company (id),
    employee_id         INT          NULL REFERENCES employee (id),
    password_changed_at TIMESTAMPTZ  NULL,
    CONSTRAINT ck_user_account_owner
        CHECK ( (employee_id IS NOT NULL AND customer_company_id IS NULL) OR
                (employee_id IS NULL AND customer_company_id IS NOT NULL) OR
                (employee_id IS NULL AND customer_company_id IS NULL) )
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

CREATE TABLE orders
(
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number VARCHAR(50)    NOT NULL,
    customer_id  INT            NOT NULL REFERENCES customer_company (id),
    order_date   TIMESTAMPTZ    NOT NULL,
    status       order_status   NOT NULL,
    total_amount NUMERIC(18, 2) NOT NULL
);

CREATE TABLE product
(
    id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(200)   NOT NULL,
    category      VARCHAR(100)   NOT NULL,
    unit          VARCHAR(50)    NOT NULL,
    default_price NUMERIC(18, 2) NOT NULL,
    is_active     BOOLEAN        NOT NULL DEFAULT TRUE
);

CREATE TABLE stock
(
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id   INT NOT NULL REFERENCES product (id),
    quantity     INT NOT NULL,
    min_quantity INT NOT NULL
);

CREATE TABLE stock_movement
(
    id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id       INT           NOT NULL REFERENCES product (id),
    quantity_change  INT           NOT NULL,
    movement_type    movement_type NOT NULL,
    related_order_id INT REFERENCES orders (id),
    reason           VARCHAR(255),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    employee_id      INT REFERENCES employee (id)

)
