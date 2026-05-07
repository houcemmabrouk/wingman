-- ============================================================
-- Stash for rejected questions — keep what we paid for.
--
-- Every time the generator validates a batch, questions that fail
-- validation rule 1..5 (anchor mismatch, citation invalid, leak,
-- duplicate, difficulty below target, calc uneval, etc.) are
-- inserted here instead of being discarded.
--
-- Use cases:
--   * post-mortem on bad generation runs (see what Claude actually emitted)
--   * manual rescue: occasionally a "rejected" question is salvageable
--   * prompt iteration: spot patterns in failure modes
-- ============================================================

CREATE TABLE IF NOT EXISTS rejected_questions (
  id              bigserial PRIMARY KEY,
  module_id       integer NOT NULL REFERENCES learning_modules(id),
  los_code        varchar(30),
  generator_version varchar(20),
  run_id          varchar(40),
  reject_code     varchar(40)  NOT NULL,
  reject_reason   text         NOT NULL,
  raw_payload     jsonb        NOT NULL,
  rejected_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rejected_q_module_at ON rejected_questions (module_id, rejected_at DESC);
CREATE INDEX IF NOT EXISTS idx_rejected_q_reject_code ON rejected_questions (reject_code);

COMMENT ON TABLE rejected_questions IS
  'Holds questions emitted by Claude that failed validation. Lets us audit failure modes without re-paying Anthropic.';
