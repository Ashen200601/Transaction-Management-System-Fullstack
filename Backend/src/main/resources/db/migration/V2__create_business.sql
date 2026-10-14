-- Businesses (tenants), and which users belong to each one with what role.
CREATE SEQUENCE business_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE business (
    business_seq       INTEGER      NOT NULL,
    name               VARCHAR(120) NOT NULL,
    currency           VARCHAR(3)   NOT NULL,
    status             INTEGER,
    created_by         VARCHAR(255) NOT NULL,
    created_date       TIMESTAMP    NOT NULL,
    last_modified_by   VARCHAR(255),
    last_modified_date TIMESTAMP,
    CONSTRAINT pk_business PRIMARY KEY (business_seq)
);

CREATE SEQUENCE business_user_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE business_user (
    business_user_seq  INTEGER      NOT NULL,
    business_seq       INTEGER      NOT NULL,
    user_seq           INTEGER      NOT NULL,
    role               VARCHAR(20)  NOT NULL,
    status             INTEGER,
    created_by         VARCHAR(255) NOT NULL,
    created_date       TIMESTAMP    NOT NULL,
    last_modified_by   VARCHAR(255),
    last_modified_date TIMESTAMP,
    CONSTRAINT pk_business_user PRIMARY KEY (business_user_seq),
    CONSTRAINT fk_business_user_business FOREIGN KEY (business_seq) REFERENCES business (business_seq),
    CONSTRAINT fk_business_user_user FOREIGN KEY (user_seq) REFERENCES users (user_seq),
    CONSTRAINT uk_business_user UNIQUE (business_seq, user_seq),
    CONSTRAINT ck_business_user_role CHECK (role IN ('OWNER', 'ADMIN', 'CASHIER', 'VIEWER'))
);

-- "Which businesses is this user in?" runs on every sign-in.
CREATE INDEX ix_business_user_user ON business_user (user_seq);
