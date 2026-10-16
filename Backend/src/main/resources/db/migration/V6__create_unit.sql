-- Units items are counted and sold in (PCS, KG, ...). One list shared by every business.
CREATE SEQUENCE unit_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE unit (
    unit_seq           INTEGER      NOT NULL,
    unit_code          VARCHAR(20)  NOT NULL,
    unit_name          VARCHAR(60)  NOT NULL,
    status             INTEGER,
    created_by         VARCHAR(255) NOT NULL,
    created_date       TIMESTAMP    NOT NULL,
    last_modified_by   VARCHAR(255),
    last_modified_date TIMESTAMP,
    CONSTRAINT pk_unit PRIMARY KEY (unit_seq)
);

-- A unit code is unique. Deleted units (status 0) free their code for reuse.
CREATE UNIQUE INDEX uk_unit_code ON unit (unit_code) WHERE status <> 0;

-- The units the item form offered until now, all APPROVED (2), in the order the form listed them.
INSERT INTO unit (unit_seq, unit_code, unit_name, status, created_by, created_date) VALUES
    (1, 'PCS',  'Piece',      2, 'system', CURRENT_TIMESTAMP),
    (2, 'KG',   'Kilogram',   2, 'system', CURRENT_TIMESTAMP),
    (3, 'G',    'Gram',       2, 'system', CURRENT_TIMESTAMP),
    (4, 'L',    'Litre',      2, 'system', CURRENT_TIMESTAMP),
    (5, 'ML',   'Millilitre', 2, 'system', CURRENT_TIMESTAMP),
    (6, 'M',    'Metre',      2, 'system', CURRENT_TIMESTAMP),
    (7, 'BOX',  'Box',        2, 'system', CURRENT_TIMESTAMP),
    (8, 'PACK', 'Pack',       2, 'system', CURRENT_TIMESTAMP);
SELECT setval('unit_seq', 8);

-- Items pointed at their unit by code; now they point at the unit row. Codes the API accepted
-- that aren't in the list above become units of their own, so no item loses its unit.
INSERT INTO unit (unit_seq, unit_code, unit_name, status, created_by, created_date)
SELECT nextval('unit_seq'), codes.unit, codes.unit, 2, 'system', CURRENT_TIMESTAMP
FROM (SELECT DISTINCT unit FROM item WHERE unit NOT IN (SELECT unit_code FROM unit)) AS codes;

ALTER TABLE item ADD COLUMN unit_seq INTEGER;
UPDATE item SET unit_seq = (SELECT unit.unit_seq FROM unit WHERE unit.unit_code = item.unit);
ALTER TABLE item ALTER COLUMN unit_seq SET NOT NULL;
ALTER TABLE item ADD CONSTRAINT fk_item_unit FOREIGN KEY (unit_seq) REFERENCES unit (unit_seq);
ALTER TABLE item DROP COLUMN unit;
