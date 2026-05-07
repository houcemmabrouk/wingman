-- ============================================================
-- 005_engine_upgrade_srs_roi.sql
-- Schema changes for the new engine (SM-2 srs.py + roi_scorer.py).
--
-- Reconciled vs the original draft:
--   - Weight reconciliation (weight_pct backfill) DROPPED — seed.sql already
--     owns the authoritative CFA L1 weights.
--   - ease_factor cap removal DROPPED — the srs_queue column is NUMERIC(4,2)
--     with no CHECK constraint in the live schema; nothing to unblock.
-- ============================================================

BEGIN;

-- ── SM-2 quality grade tracking (srs.py) ───────────────────
ALTER TABLE srs_queue
    ADD COLUMN IF NOT EXISTS last_grade SMALLINT
        CHECK (last_grade BETWEEN 0 AND 5);


-- ── ROI scorer: per-LM time cost ───────────────────────────
ALTER TABLE learning_modules
    ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 25;


-- ── ROI scorer: prereq graph (optional, scorer falls back) ─
CREATE TABLE IF NOT EXISTS module_prereqs (
    module_id        INTEGER NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    prereq_module_id INTEGER NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    PRIMARY KEY (module_id, prereq_module_id),
    CHECK (module_id <> prereq_module_id)
);
CREATE INDEX IF NOT EXISTS idx_module_prereqs_prereq
    ON module_prereqs(prereq_module_id);


-- ── ROI scorer: phase tracking on study_plans ──────────────
ALTER TABLE study_plans
    ADD COLUMN IF NOT EXISTS current_phase VARCHAR(20) DEFAULT 'consolidation'
        CHECK (current_phase IN ('discovery', 'consolidation', 'simulation'));


-- ── Performance indexes (read paths in new engine) ─────────
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_question
    ON question_attempts(user_id, question_id);

CREATE INDEX IF NOT EXISTS idx_lm_mastery_user_module
    ON lm_mastery(user_id, module_id);

CREATE INDEX IF NOT EXISTS idx_srs_queue_user_card
    ON srs_queue(user_id, card_type, card_id);

COMMIT;
