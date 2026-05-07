-- ============================================================
-- 008_question_audit_and_disputes.sql
-- Adds quarantine + audit + dispute infrastructure to QBank.
--
-- Why: Q995 (FSA-03-LO02) was found to teach a factually wrong rule
-- (deferred tax assets classified as current). Root cause is a generation
-- pipeline that lets chain-of-thought leak into debriefs without standard
-- citation. This migration installs the building blocks for:
--   1. Quarantining wrong questions (questions.disabled_at)
--   2. Running automated content audits (question_audits)
--   3. Letting users challenge questions in-app (question_disputes)
-- ============================================================

BEGIN;

-- ── 1. Quarantine columns on questions ──────────────────────
-- disabled_at NULL => active; non-NULL => excluded from sessions.
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS disabled_at      TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS disabled_reason  TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_active
    ON questions (id) WHERE disabled_at IS NULL;

-- ── 1b. Mastery bonus channel ───────────────────────────────
-- Survives the mastery cascade (which derives mastery_level from
-- question_attempts and would otherwise wipe a one-shot bonus).
-- Effective LOS mastery = mastery_level + bonus_pct (capped at 100).
ALTER TABLE los_mastery
    ADD COLUMN IF NOT EXISTS bonus_pct NUMERIC(5,2) NOT NULL DEFAULT 0;

-- ── 2. Audit results ────────────────────────────────────────
-- One row per (question, audit_run). Stores Claude's verdict + the
-- standard citation it used. If verdict = 'wrong' and confidence is high,
-- the question is auto-quarantined (handled by the audit script).
CREATE TABLE IF NOT EXISTS question_audits (
    id                  BIGSERIAL    PRIMARY KEY,
    question_id         INT          NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    run_id              VARCHAR(40)  NOT NULL,
    model_used          VARCHAR(60)  NOT NULL,
    verdict             VARCHAR(20)  NOT NULL CHECK (verdict IN (
                            'correct','question_wrong','debrief_wrong',
                            'out_of_scope','ambiguous','leak_detected'
                        )),
    confidence          NUMERIC(4,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    correctness_score   NUMERIC(4,2) CHECK (correctness_score BETWEEN 0 AND 1),
    debrief_quality     NUMERIC(4,2) CHECK (debrief_quality   BETWEEN 0 AND 1),
    standard_citation   TEXT,
    reason              TEXT         NOT NULL,
    raw_response        JSONB,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_question_audits_q       ON question_audits (question_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_audits_run     ON question_audits (run_id);
CREATE INDEX IF NOT EXISTS idx_question_audits_verdict ON question_audits (verdict) WHERE verdict <> 'correct';

-- ── 3. User disputes (Challenge Wingman) ────────────────────
-- A user clicks "Contester" on a debrief. Status flow:
--   pending -> auto_review -> upheld | rejected | needs_human
-- 'upheld' triggers question quarantine + mastery bonus on the LOS.
CREATE TABLE IF NOT EXISTS question_disputes (
    id                  BIGSERIAL    PRIMARY KEY,
    question_id         INT          NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id             UUID         NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    attempt_id          INT          REFERENCES question_attempts(id)  ON DELETE SET NULL,
    selected_answer     CHAR(1)      CHECK (selected_answer IN ('A','B','C')),
    claimed_answer      CHAR(1)      CHECK (claimed_answer  IN ('A','B','C')),
    user_reason         TEXT,
    status              VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN (
                            'pending','auto_review','upheld','rejected','needs_human'
                        )),
    arbiter_verdict     VARCHAR(20),
    arbiter_confidence  NUMERIC(4,2) CHECK (arbiter_confidence BETWEEN 0 AND 1),
    arbiter_reason      TEXT,
    arbiter_citation    TEXT,
    mastery_bonus_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_question_disputes_user   ON question_disputes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_disputes_q      ON question_disputes (question_id);
CREATE INDEX IF NOT EXISTS idx_question_disputes_open   ON question_disputes (status) WHERE status IN ('pending','auto_review','needs_human');

-- ── 4. Quarantine Q995 immediately ──────────────────────────
-- The Meridian Corporation balance-sheet question. Marks DTA as current,
-- which is wrong under both ASC 740-10-45-4 (US GAAP, since 2015: all
-- DTAs non-current) and IAS 1.56 (IFRS: DTAs never classified as current).
-- The correct answer is B ($5,200,000), not C ($5,800,000).
UPDATE questions
SET disabled_at     = now(),
    disabled_reason = 'AUDIT 2026-05-02: marks deferred tax asset $600k as '
                   || 'current. Under ASC 740-10-45-4 and IAS 1.56, DTAs are '
                   || 'always non-current. Correct answer is B ($5.2M), not '
                   || 'C ($5.8M). Debrief also shows chain-of-thought leakage '
                   || '("re-reading more carefully…").'
WHERE id = 995 AND disabled_at IS NULL;

COMMIT;
