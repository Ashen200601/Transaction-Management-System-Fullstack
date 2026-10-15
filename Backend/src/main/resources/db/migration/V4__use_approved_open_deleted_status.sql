-- MasterDataStatus changed from ACTIVE = 1 / INACTIVE = 2 to the codes used across the company:
--   APPROVED = 2 (in use), OPEN = 1 (inactive), DELETED = 0 (deleted).
-- Rows written before the change used the old numbers, so swap them: what was active (1)
-- becomes APPROVED (2), and what was inactive (2) becomes OPEN (1).
UPDATE users         SET status = CASE status WHEN 1 THEN 2 WHEN 2 THEN 1 ELSE status END;
UPDATE business      SET status = CASE status WHEN 1 THEN 2 WHEN 2 THEN 1 ELSE status END;
UPDATE business_user SET status = CASE status WHEN 1 THEN 2 WHEN 2 THEN 1 ELSE status END;
UPDATE refresh_token SET status = CASE status WHEN 1 THEN 2 WHEN 2 THEN 1 ELSE status END;
