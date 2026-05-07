-- End-of-session checklists (form filled by the user after a study session)
CREATE TABLE IF NOT EXISTS session_checklists (
    id              SERIAL PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
    blocks          JSONB        NOT NULL DEFAULT '[]'::jsonb,
    los_mastery     JSONB        NOT NULL DEFAULT '[]'::jsonb,
    notes           TEXT         DEFAULT '',
    energy          SMALLINT     CHECK (energy BETWEEN 1 AND 5),
    confidence      SMALLINT     CHECK (confidence BETWEEN 1 AND 5),
    minutes_planned INT          DEFAULT 0,
    minutes_actual  INT          DEFAULT 0,
    pdf_path        TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_checklists_user_date
    ON session_checklists(user_id, session_date DESC);
