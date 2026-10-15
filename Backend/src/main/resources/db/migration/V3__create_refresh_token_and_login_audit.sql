-- Refresh tokens: one row per token issued. A sign-in starts a session (session_id); every
-- refresh uses up the current token and adds the next one to the same session. Only a
-- SHA-256 hash of each token is stored, so a copy of this table can't be used to sign in.
CREATE SEQUENCE refresh_token_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE refresh_token (
    refresh_token_seq  INTEGER      NOT NULL,
    user_seq           INTEGER      NOT NULL,
    token_hash         VARCHAR(64)  NOT NULL,
    session_id         VARCHAR(36)  NOT NULL,
    expires_date       TIMESTAMP    NOT NULL,
    used_date          TIMESTAMP,
    revoked_date       TIMESTAMP,
    revoked_reason     VARCHAR(30),
    ip_address         VARCHAR(45),
    user_agent         VARCHAR(500),
    status             INTEGER,
    created_by         VARCHAR(255) NOT NULL,
    created_date       TIMESTAMP    NOT NULL,
    last_modified_by   VARCHAR(255),
    last_modified_date TIMESTAMP,
    CONSTRAINT pk_refresh_token PRIMARY KEY (refresh_token_seq),
    CONSTRAINT uk_refresh_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_seq) REFERENCES users (user_seq) ON DELETE CASCADE,
    CONSTRAINT ck_refresh_token_reason CHECK (revoked_reason IN ('LOGOUT', 'TOKEN_REUSED', 'ACCOUNT_DISABLED'))
);

CREATE INDEX ix_refresh_token_session ON refresh_token (session_id);
CREATE INDEX ix_refresh_token_expires ON refresh_token (expires_date);

-- Every sign-in attempt, refresh and sign-out. Rows are never changed. user_seq is empty when
-- the username didn't match an account; username then holds what was typed.
CREATE SEQUENCE user_login_audit_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE user_login_audit (
    user_login_audit_seq INTEGER      NOT NULL,
    user_seq             INTEGER,
    username             VARCHAR(100),
    event                VARCHAR(20)  NOT NULL,
    result               VARCHAR(30)  NOT NULL,
    session_id           VARCHAR(36),
    ip_address           VARCHAR(45),
    user_agent           VARCHAR(500),
    created_by           VARCHAR(255) NOT NULL,
    created_date         TIMESTAMP    NOT NULL,
    last_modified_by     VARCHAR(255),
    last_modified_date   TIMESTAMP,
    CONSTRAINT pk_user_login_audit PRIMARY KEY (user_login_audit_seq),
    CONSTRAINT fk_user_login_audit_user FOREIGN KEY (user_seq) REFERENCES users (user_seq) ON DELETE SET NULL,
    CONSTRAINT ck_user_login_audit_event CHECK (event IN ('LOGIN', 'REFRESH', 'LOGOUT')),
    CONSTRAINT ck_user_login_audit_result CHECK (result IN ('SUCCESS', 'INVALID_CREDENTIALS', 'ACCOUNT_DISABLED',
        'INVALID_TOKEN', 'SESSION_EXPIRED', 'SESSION_REVOKED', 'TOKEN_REUSED'))
);

CREATE INDEX ix_user_login_audit_user_date ON user_login_audit (user_seq, created_date);
CREATE INDEX ix_user_login_audit_date ON user_login_audit (created_date);
