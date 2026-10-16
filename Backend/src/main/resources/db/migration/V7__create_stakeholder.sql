-- Stakeholders: the parties a business deals with (customers, vendors, ...). A stakeholder can
-- have several types, so the types are linked through stakeholder_stakeholder_type.

-- The types, shared by every business.
CREATE SEQUENCE stakeholder_type_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE stakeholder_type (
    stakeholder_type_seq  INTEGER      NOT NULL,
    stakeholder_type_code VARCHAR(20)  NOT NULL,
    stakeholder_type_name VARCHAR(60)  NOT NULL,
    status                INTEGER,
    created_by            VARCHAR(255) NOT NULL,
    created_date          TIMESTAMP    NOT NULL,
    last_modified_by      VARCHAR(255),
    last_modified_date    TIMESTAMP,
    CONSTRAINT pk_stakeholder_type PRIMARY KEY (stakeholder_type_seq)
);

-- A type code is unique. Deleted types (status 0) free their code for reuse.
CREATE UNIQUE INDEX uk_stakeholder_type_code ON stakeholder_type (stakeholder_type_code) WHERE status <> 0;

-- Both APPROVED (2).
INSERT INTO stakeholder_type (stakeholder_type_seq, stakeholder_type_code, stakeholder_type_name, status, created_by, created_date) VALUES
    (1, 'CUSTOMER', 'Customer', 2, 'system', CURRENT_TIMESTAMP),
    (2, 'VENDOR',   'Vendor',   2, 'system', CURRENT_TIMESTAMP);
SELECT setval('stakeholder_type_seq', 2);

-- The stakeholders. Each belongs to one business.
CREATE SEQUENCE stakeholder_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE stakeholder (
    stakeholder_seq    INTEGER      NOT NULL,
    business_seq       INTEGER      NOT NULL,
    stakeholder_code   VARCHAR(30)  NOT NULL,
    stakeholder_name   VARCHAR(120) NOT NULL,
    phone              VARCHAR(30),
    email              VARCHAR(120),
    address            VARCHAR(500),
    -- VAT or business registration number.
    tax_no             VARCHAR(50),
    status             INTEGER,
    created_by         VARCHAR(255) NOT NULL,
    created_date       TIMESTAMP    NOT NULL,
    last_modified_by   VARCHAR(255),
    last_modified_date TIMESTAMP,
    CONSTRAINT pk_stakeholder PRIMARY KEY (stakeholder_seq),
    CONSTRAINT fk_stakeholder_business FOREIGN KEY (business_seq) REFERENCES business (business_seq)
);

-- A stakeholder code is unique within its business. Deleted stakeholders (status 0) free their code.
CREATE UNIQUE INDEX uk_stakeholder_business_code ON stakeholder (business_seq, stakeholder_code) WHERE status <> 0;

-- Which types each stakeholder has (many-to-many).
CREATE SEQUENCE stakeholder_stakeholder_type_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE stakeholder_stakeholder_type (
    stakeholder_stakeholder_type_seq INTEGER      NOT NULL,
    stakeholder_seq                  INTEGER      NOT NULL,
    stakeholder_type_seq             INTEGER      NOT NULL,
    status                           INTEGER,
    created_by                       VARCHAR(255) NOT NULL,
    created_date                     TIMESTAMP    NOT NULL,
    last_modified_by                 VARCHAR(255),
    last_modified_date               TIMESTAMP,
    CONSTRAINT pk_stakeholder_stakeholder_type PRIMARY KEY (stakeholder_stakeholder_type_seq),
    CONSTRAINT fk_stakeholder_stakeholder_type_stakeholder FOREIGN KEY (stakeholder_seq) REFERENCES stakeholder (stakeholder_seq),
    CONSTRAINT fk_stakeholder_stakeholder_type_type FOREIGN KEY (stakeholder_type_seq) REFERENCES stakeholder_type (stakeholder_type_seq)
);

-- A stakeholder has each type at most once (deleted links aside). Also serves "this stakeholder's types".
CREATE UNIQUE INDEX uk_stakeholder_stakeholder_type ON stakeholder_stakeholder_type (stakeholder_seq, stakeholder_type_seq) WHERE status <> 0;
-- "Stakeholders of this type", for the type filter.
CREATE INDEX ix_stakeholder_stakeholder_type_type ON stakeholder_stakeholder_type (stakeholder_type_seq);
