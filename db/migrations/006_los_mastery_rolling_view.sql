-- ============================================================
-- 006_los_mastery_rolling_view.sql
-- View aggregating los_mastery with the rolling average of the
-- last 10 question_attempts per (user, LOS).
--
-- Consumed by /api/v1/nba/critical-path to pick the most urgent LOS
-- using a *recent* signal (rolling) rather than a lifetime average.
-- ============================================================

BEGIN;

CREATE OR REPLACE VIEW los_mastery_rolling AS
WITH ranked AS (
    SELECT
        qa.user_id,
        q.outcome_id,
        qa.is_correct,
        qa.created_at,
        ROW_NUMBER() OVER (
            PARTITION BY qa.user_id, q.outcome_id
            ORDER BY qa.created_at DESC
        ) AS rn
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    WHERE q.outcome_id IS NOT NULL
),
rolling AS (
    SELECT
        user_id,
        outcome_id,
        COUNT(*) FILTER (WHERE rn <= 10)::int AS attempts_last_10,
        ROUND(
            AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END) FILTER (WHERE rn <= 10)::numeric,
            2
        ) AS rolling_pct_10,
        MAX(created_at) FILTER (WHERE rn = 1) AS last_attempt_at
    FROM ranked
    GROUP BY user_id, outcome_id
)
SELECT
    lo.id                                        AS outcome_id,
    lo.code                                      AS los_code,
    lo.description                               AS los_description,
    lo.bloom_level                               AS bloom_level,
    lm.id                                        AS module_id,
    lm.code                                      AS module_code,
    lm.title                                     AS module_title,
    t.id                                         AS topic_id,
    t.code                                       AS topic_code,
    t.name                                       AS topic_name,
    COALESCE(t.weight_pct, 10.0)::numeric(5,2)   AS weight_pct,
    los.user_id                                  AS user_id,
    COALESCE(los.mastery_level, 0)::numeric(5,2) AS lifetime_mastery,
    COALESCE(los.attempts_total, 0)              AS lifetime_attempts,
    COALESCE(los.attempts_correct, 0)            AS lifetime_correct,
    COALESCE(r.attempts_last_10, 0)              AS attempts_last_10,
    COALESCE(r.rolling_pct_10, COALESCE(los.mastery_level, 0))::numeric(5,2) AS rolling_pct_10,
    r.last_attempt_at                            AS last_attempt_at,
    -- Effective mastery favors the recent signal once the user has done
    -- at least 3 attempts on this LOS in the last 10 window.
    (CASE
        WHEN COALESCE(r.attempts_last_10, 0) >= 3
            THEN r.rolling_pct_10
        ELSE COALESCE(los.mastery_level, 0)
     END)::numeric(5,2)                          AS effective_mastery_pct,
    -- Urgency: gap to mastery × topic weight, weighted up if signal is fresh.
    ROUND(
        (100.0 - (CASE
            WHEN COALESCE(r.attempts_last_10, 0) >= 3 THEN r.rolling_pct_10
            ELSE COALESCE(los.mastery_level, 0)
        END))
        * (COALESCE(t.weight_pct, 10.0) / 10.0),
        2
    )                                            AS urgency_score
FROM learning_outcomes lo
JOIN learning_modules  lm  ON lm.id = lo.module_id
JOIN topics            t   ON t.id  = lm.topic_id
LEFT JOIN los_mastery  los ON los.outcome_id = lo.id
LEFT JOIN rolling      r   ON r.outcome_id = lo.id
                          AND r.user_id     = los.user_id;

COMMENT ON VIEW los_mastery_rolling IS
    'Per-(user, LOS) snapshot combining lifetime los_mastery with a 10-attempt rolling pct. '
    'effective_mastery_pct prefers the rolling signal once attempts_last_10 >= 3. '
    'urgency_score = (100 - effective_mastery_pct) * (topic.weight_pct / 10).';

COMMIT;
