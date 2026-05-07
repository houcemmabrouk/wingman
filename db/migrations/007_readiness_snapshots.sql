-- ============================================================
-- 007_readiness_snapshots.sql
-- One row per (user, day) capturing the readiness triple so we can
-- compute velocity (weekly trend) without re-running the full retention
-- math for every historical date.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS readiness_snapshots (
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date   DATE        NOT NULL,
    readiness_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
    retention_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
    coverage_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
    seen_lms        INTEGER     NOT NULL DEFAULT 0,
    total_lms       INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_user_date
    ON readiness_snapshots (user_id, snapshot_date DESC);

COMMIT;
