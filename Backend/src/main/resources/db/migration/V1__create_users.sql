-- Accounts that can sign in. "user" is a reserved word in PostgreSQL, so the table is "users".
CREATE SEQUENCE user_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE users (
    user_seq           INTEGER      NOT NULL,
    username           VARCHAR(30)  NOT NULL,
    name               VARCHAR(100) NOT NULL,
    email              VARCHAR(254) NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    status             INTEGER,
    created_by         VARCHAR(255) NOT NULL,
    created_date       TIMESTAMP    NOT NULL,
    last_modified_by   VARCHAR(255),
    last_modified_date TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (user_seq),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
);
