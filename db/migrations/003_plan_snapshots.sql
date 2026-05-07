-- Persistent snapshots of every successfully generated planning state.
-- Serves as a fallback when the Claude API is unavailable (credit issues, timeouts, etc.).
CREATE TABLE IF NOT EXISTS plan_snapshots (
    id              SERIAL PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dto             JSONB        NOT NULL,
    matrix_version  VARCHAR(100) NOT NULL,
    generated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_snapshots_user_time
    ON plan_snapshots(user_id, generated_at DESC);
