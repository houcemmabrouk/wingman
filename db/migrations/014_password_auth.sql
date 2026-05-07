-- Password auth support.
-- The base schema already includes users.password_hash; this migration is
-- idempotent for older databases that were created before that column existed.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT;
