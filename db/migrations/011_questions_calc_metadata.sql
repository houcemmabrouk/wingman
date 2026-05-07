-- ============================================================
-- Add calc_metadata to questions for retroactive calc audit.
--
-- Schema:
--   {
--     "is_calculation": true,
--     "python_expr": "(0.75 * 10 + 0.25 * 0) / 1.05",
--     "expected_value": 7.142857,
--     "actual_value": 7.142857,
--     "corrected_at": "2026-05-05T13:30:00Z" | null,
--     "original_choice": "$8.50 per share" | null
--   }
-- ============================================================

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS calc_metadata jsonb;

CREATE INDEX IF NOT EXISTS idx_questions_calc_metadata_iscalc
  ON questions ((calc_metadata->>'is_calculation'))
  WHERE calc_metadata IS NOT NULL;

COMMENT ON COLUMN questions.calc_metadata IS
  'Sandboxed Python expression + values for calculation questions. Populated by question_generator v2.4+. Enables retroactive calc audit.';
