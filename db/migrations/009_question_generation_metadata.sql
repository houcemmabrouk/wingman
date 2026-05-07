-- ============================================================
-- 009_question_generation_metadata.sql
-- Persists the metadata produced by the v2 question generator so
-- that downstream tools (audit, dispute arbiter, admin UI) can
-- read the LOS anchor, standard citation, and per-distractor traps
-- without re-asking Claude.
-- ============================================================

BEGIN;

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS los_anchor          TEXT,
    ADD COLUMN IF NOT EXISTS standard_citation   TEXT,
    ADD COLUMN IF NOT EXISTS trap_per_distractor JSONB,
    ADD COLUMN IF NOT EXISTS generator_version   VARCHAR(20),
    ADD COLUMN IF NOT EXISTS generated_at        TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_questions_generator_version
    ON questions (generator_version) WHERE generator_version IS NOT NULL;

COMMIT;
