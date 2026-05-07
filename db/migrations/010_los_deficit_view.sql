-- ============================================================
-- LOS deficit view — ranks LOS by 5 deficit criteria
-- D1: < 3 active questions
-- D2: 0 hard questions (difficulty >= 4)
-- D3: Bloom 4+ LOS with no medium+ question (difficulty < 3 only)
-- D4: < 50% of active questions have full tagging (citation + traps)
-- D5: error rate > 0.4 across all users with at least 3 attempts
--
-- deficit_score = sum of failed criteria (0..5)
-- ============================================================

CREATE OR REPLACE VIEW los_deficit_v AS
WITH q_stats AS (
  SELECT
    q.outcome_id,
    COUNT(*) FILTER (WHERE q.disabled_at IS NULL) AS active_q,
    COUNT(*) FILTER (WHERE q.disabled_at IS NULL AND q.difficulty >= 4) AS hard_q,
    COUNT(*) FILTER (WHERE q.disabled_at IS NULL AND q.difficulty >= 3) AS medium_plus_q,
    COUNT(*) FILTER (
      WHERE q.disabled_at IS NULL
        AND q.standard_citation IS NOT NULL AND q.standard_citation <> ''
        AND q.trap_per_distractor IS NOT NULL
    ) AS tagged_q,
    AVG(q.difficulty) FILTER (WHERE q.disabled_at IS NULL) AS avg_difficulty
  FROM questions q
  WHERE q.outcome_id IS NOT NULL
  GROUP BY q.outcome_id
),
a_stats AS (
  SELECT
    q.outcome_id,
    COUNT(qa.id) AS attempts_total,
    COUNT(qa.id) FILTER (WHERE qa.is_correct = false) AS wrong_attempts,
    COUNT(qa.id) FILTER (WHERE qa.is_correct = true)  AS right_attempts,
    COUNT(DISTINCT qa.user_id) FILTER (WHERE qa.is_correct = false) AS users_who_failed,
    AVG(qa.time_spent_sec) AS mean_time_spent_sec
  FROM questions q
  JOIN question_attempts qa ON qa.question_id = q.id
  WHERE q.outcome_id IS NOT NULL
  GROUP BY q.outcome_id
)
SELECT
  lo.id AS los_id,
  lo.code AS los_code,
  lo.description AS los_description,
  lo.bloom_level,
  lm.id AS module_id,
  lm.code AS module_code,
  lm.title AS module_title,
  t.code AS topic_code,
  t.name AS topic_name,
  COALESCE(qs.active_q, 0)       AS active_q,
  COALESCE(qs.hard_q, 0)         AS hard_q,
  COALESCE(qs.medium_plus_q, 0)  AS medium_plus_q,
  COALESCE(qs.tagged_q, 0)       AS tagged_q,
  ROUND(COALESCE(qs.avg_difficulty, 0)::numeric, 2) AS avg_difficulty,
  COALESCE(ast.attempts_total, 0)    AS attempts_total,
  COALESCE(ast.wrong_attempts, 0)    AS wrong_attempts,
  COALESCE(ast.right_attempts, 0)    AS right_attempts,
  COALESCE(ast.users_who_failed, 0)  AS users_who_failed,
  CASE WHEN COALESCE(ast.attempts_total, 0) > 0
       THEN ROUND(COALESCE(ast.wrong_attempts, 0)::numeric / ast.attempts_total, 2)
       ELSE NULL
  END AS error_rate,
  ROUND(COALESCE(ast.mean_time_spent_sec, 0)::numeric, 1) AS mean_time_spent_sec,
  -- D1
  (CASE WHEN COALESCE(qs.active_q, 0) < 3 THEN 1 ELSE 0 END) AS d1_quantity,
  -- D2
  (CASE WHEN COALESCE(qs.hard_q, 0) = 0 THEN 1 ELSE 0 END) AS d2_no_hard,
  -- D3
  (CASE WHEN lo.bloom_level >= 4 AND COALESCE(qs.medium_plus_q, 0) = 0 THEN 1 ELSE 0 END) AS d3_bloom_misalign,
  -- D4
  (CASE WHEN COALESCE(qs.active_q, 0) > 0
        AND COALESCE(qs.tagged_q, 0)::float / NULLIF(qs.active_q, 0) < 0.5 THEN 1 ELSE 0 END) AS d4_legacy,
  -- D5: behavioral. Need >= 3 attempts to reduce noise.
  (CASE WHEN COALESCE(ast.attempts_total, 0) >= 3
        AND COALESCE(ast.wrong_attempts, 0)::float / NULLIF(ast.attempts_total, 0) > 0.4 THEN 1 ELSE 0 END) AS d5_user_failure,
  -- aggregate
  ((CASE WHEN COALESCE(qs.active_q, 0) < 3 THEN 1 ELSE 0 END)
 + (CASE WHEN COALESCE(qs.hard_q, 0) = 0 THEN 1 ELSE 0 END)
 + (CASE WHEN lo.bloom_level >= 4 AND COALESCE(qs.medium_plus_q, 0) = 0 THEN 1 ELSE 0 END)
 + (CASE WHEN COALESCE(qs.active_q, 0) > 0
         AND COALESCE(qs.tagged_q, 0)::float / NULLIF(qs.active_q, 0) < 0.5 THEN 1 ELSE 0 END)
 + (CASE WHEN COALESCE(ast.attempts_total, 0) >= 3
         AND COALESCE(ast.wrong_attempts, 0)::float / NULLIF(ast.attempts_total, 0) > 0.4 THEN 1 ELSE 0 END)
  ) AS deficit_score
FROM learning_outcomes lo
JOIN learning_modules lm ON lm.id = lo.module_id
JOIN topics t ON t.id = lm.topic_id
LEFT JOIN q_stats qs ON qs.outcome_id = lo.id
LEFT JOIN a_stats ast ON ast.outcome_id = lo.id;

COMMENT ON VIEW los_deficit_v IS
  'Ranks each learning outcome by 5 deficit criteria (D1-D5). See db/migrations/010_los_deficit_view.sql for details.';
