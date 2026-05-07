-- ============================================================
-- 013_inbox_state.sql
-- Tracks per-user state for the unified NBA Inbox (read / dismissed).
--
-- Why: the NBA Inbox aggregates 6 source streams (NBA actions, alerts,
-- disputes, coach proactive, plan entries, SRS due) into a single list.
-- Each item has a stable item_key (e.g. "action:slot-a:eth-02:2026-05-06")
-- so we can persist user-level state across pollings without owning the
-- source rows. read_at = item viewed by user; dismissed_at = item
-- explicitly dismissed (won't reappear). Both can coexist; the aggregator
-- excludes any row with dismissed_at set.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS inbox_state (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_key      VARCHAR(160) NOT NULL,
    read_at       TIMESTAMPTZ,
    dismissed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (user_id, item_key)
);

-- Hot path: count unread non-dismissed for badge polling (every 30s in the sidebar).
CREATE INDEX IF NOT EXISTS idx_inbox_state_user_active
    ON inbox_state (user_id) WHERE read_at IS NULL AND dismissed_at IS NULL;

-- Used by the aggregator to filter out dismissed items via LEFT JOIN.
CREATE INDEX IF NOT EXISTS idx_inbox_state_user_key
    ON inbox_state (user_id, item_key);

COMMIT;
