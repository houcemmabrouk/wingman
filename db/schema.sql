-- ============================================================
-- Wingman — Learning OS for CFA Level I
-- Schema v1.0
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for content embeddings

-- ============================================================
-- 1. CURRICULUM DOMAIN
-- ============================================================

CREATE TABLE topics (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(10)  NOT NULL UNIQUE,   -- e.g. 'QM', 'FI', 'ETH'
    name            VARCHAR(120) NOT NULL,
    weight_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE learning_modules (
    id              SERIAL PRIMARY KEY,
    topic_id        INT          NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    code            VARCHAR(20)  NOT NULL UNIQUE,   -- e.g. 'QM-01'
    title           VARCHAR(255) NOT NULL,
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE learning_outcomes (
    id              SERIAL PRIMARY KEY,
    module_id       INT          NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    code            VARCHAR(30)  NOT NULL UNIQUE,   -- e.g. 'QM-01-a'
    description     TEXT         NOT NULL,
    bloom_level     SMALLINT     NOT NULL DEFAULT 1 CHECK (bloom_level BETWEEN 1 AND 6),
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. USER DOMAIN
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT,
    display_name    VARCHAR(100) NOT NULL,
    provider        VARCHAR(20)  NOT NULL DEFAULT 'email',
    image           TEXT,
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE magic_tokens (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    token           VARCHAR(500) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ  NOT NULL,
    used            BOOLEAN      NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE user_profiles (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    exam_date           DATE,
    daily_minutes_goal  SMALLINT    NOT NULL DEFAULT 90,
    timezone            VARCHAR(50) NOT NULL DEFAULT 'UTC',
    streak_current      INT         NOT NULL DEFAULT 0,
    streak_longest      INT         NOT NULL DEFAULT 0,
    xp_total            INT         NOT NULL DEFAULT 0,
    level               SMALLINT    NOT NULL DEFAULT 1,
    onboarding_done     BOOLEAN     NOT NULL DEFAULT false,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. PLANNING & SRS DOMAIN
-- ============================================================

CREATE TABLE study_plans (
    id              SERIAL PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(120) NOT NULL DEFAULT 'Default Plan',
    start_date      DATE         NOT NULL,
    end_date        DATE         NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE plan_entries (
    id              SERIAL PRIMARY KEY,
    plan_id         INT          NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    module_id       INT          NOT NULL REFERENCES learning_modules(id),
    scheduled_date  DATE         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','completed','skipped')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE srs_queue (
    id              SERIAL PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_type       VARCHAR(20)  NOT NULL CHECK (card_type IN ('flashcard','question')),
    card_id         INT          NOT NULL,
    ease_factor     NUMERIC(4,2) NOT NULL DEFAULT 2.50,
    interval_days   INT          NOT NULL DEFAULT 1,
    repetitions     INT          NOT NULL DEFAULT 0,
    next_review     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_review     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. SESSION & PERFORMANCE DOMAIN
-- ============================================================

CREATE TABLE sessions (
    id              SERIAL PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_entry_id   INT          REFERENCES plan_entries(id),
    started_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    ended_at        TIMESTAMPTZ,
    duration_sec    INT,
    session_type    VARCHAR(30)  NOT NULL DEFAULT 'study'
                        CHECK (session_type IN ('study','review','quiz','mock_exam')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE performance_records (
    id              SERIAL PRIMARY KEY,
    session_id      INT          NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    module_id       INT          NOT NULL REFERENCES learning_modules(id),
    score           NUMERIC(5,2),
    questions_total INT          NOT NULL DEFAULT 0,
    questions_correct INT        NOT NULL DEFAULT 0,
    time_spent_sec  INT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE question_attempts (
    id              SERIAL PRIMARY KEY,
    session_id      INT          NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id     INT          NOT NULL,
    user_id         UUID         NOT NULL REFERENCES users(id),
    selected_answer CHAR(1),
    is_correct      BOOLEAN,
    time_spent_sec  INT,
    confidence      SMALLINT     CHECK (confidence BETWEEN 1 AND 5),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. PROGRESS & ANALYTICS DOMAIN
-- ============================================================

CREATE TABLE progress_snapshots (
    id              SERIAL PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date   DATE         NOT NULL,
    modules_done    INT          NOT NULL DEFAULT 0,
    modules_total   INT          NOT NULL DEFAULT 0,
    avg_score       NUMERIC(5,2),
    study_minutes   INT          NOT NULL DEFAULT 0,
    streak          INT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, snapshot_date)
);

CREATE TABLE lm_mastery (
    id              SERIAL PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id       INT          NOT NULL REFERENCES learning_modules(id),
    mastery_level   NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 100),
    last_studied    TIMESTAMPTZ,
    review_count    INT          NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, module_id)
);

-- Learning-outcome-level mastery (LOS → feeds into lm_mastery)
CREATE TABLE los_mastery (
    id              SERIAL PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    outcome_id      INT          NOT NULL REFERENCES learning_outcomes(id),
    mastery_level   NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 100),
    attempts_total  INT          NOT NULL DEFAULT 0,
    attempts_correct INT         NOT NULL DEFAULT 0,
    last_attempted  TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, outcome_id)
);
CREATE INDEX idx_los_mastery_user ON los_mastery(user_id, outcome_id);

-- ============================================================
-- 6. ALERTS & WEAKNESS TRACKING
-- ============================================================

CREATE TABLE alerts (
    id              SERIAL PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type      VARCHAR(30)  NOT NULL
                        CHECK (alert_type IN ('streak_risk','low_mastery','behind_schedule','review_due','milestone')),
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    is_read         BOOLEAN      NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE weakness_log (
    id              SERIAL PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id       INT          NOT NULL REFERENCES learning_modules(id),
    outcome_id      INT          REFERENCES learning_outcomes(id),
    weakness_type   VARCHAR(30)  NOT NULL
                        CHECK (weakness_type IN ('conceptual','calculation','recall','application')),
    severity        SMALLINT     NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
    notes           TEXT,
    resolved        BOOLEAN      NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);

-- ============================================================
-- 7. CONTENT DOMAIN
-- ============================================================

CREATE TABLE questions (
    id              SERIAL PRIMARY KEY,
    module_id       INT          NOT NULL REFERENCES learning_modules(id),
    outcome_id      INT          REFERENCES learning_outcomes(id),
    stem            TEXT         NOT NULL,
    choice_a        TEXT         NOT NULL,
    choice_b        TEXT         NOT NULL,
    choice_c        TEXT         NOT NULL,
    correct_answer  CHAR(1)      NOT NULL CHECK (correct_answer IN ('A','B','C')),
    explanation     TEXT,
    difficulty      SMALLINT     NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 5),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE flashcards (
    id              SERIAL PRIMARY KEY,
    module_id       INT          NOT NULL REFERENCES learning_modules(id),
    outcome_id      INT          REFERENCES learning_outcomes(id),
    front           TEXT         NOT NULL,
    back            TEXT         NOT NULL,
    tags            TEXT[]       DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE content_assets (
    id              SERIAL PRIMARY KEY,
    module_id       INT          NOT NULL REFERENCES learning_modules(id),
    asset_type      VARCHAR(20)  NOT NULL CHECK (asset_type IN ('pdf','video','summary','formula_sheet')),
    title           VARCHAR(255) NOT NULL,
    url             TEXT         NOT NULL,
    metadata        JSONB        DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE content_vectors (
    id              SERIAL PRIMARY KEY,
    asset_id        INT          REFERENCES content_assets(id) ON DELETE CASCADE,
    module_id       INT          NOT NULL REFERENCES learning_modules(id),
    chunk_text      TEXT         NOT NULL,
    embedding       vector(1536),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Daily brief: key metrics per user
CREATE VIEW v_user_daily_brief AS
SELECT
    u.id                    AS user_id,
    u.display_name,
    up.streak_current,
    up.xp_total,
    up.daily_minutes_goal,
    COALESCE(today.study_min, 0)    AS today_minutes,
    COALESCE(today.sessions_ct, 0)  AS today_sessions,
    (SELECT COUNT(*) FROM srs_queue sq
        WHERE sq.user_id = u.id AND sq.next_review <= now())
                            AS cards_due,
    (SELECT COUNT(*) FROM alerts a
        WHERE a.user_id = u.id AND a.is_read = false)
                            AS unread_alerts
FROM users u
JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN LATERAL (
    SELECT
        SUM(s.duration_sec) / 60    AS study_min,
        COUNT(*)                    AS sessions_ct
    FROM sessions s
    WHERE s.user_id = u.id
      AND s.started_at::date = CURRENT_DATE
) today ON true;

-- Per-module performance view
CREATE VIEW v_lm_performance AS
SELECT
    pr.module_id,
    lm.code             AS module_code,
    lm.title            AS module_title,
    t.code              AS topic_code,
    COUNT(pr.id)        AS attempt_count,
    ROUND(AVG(pr.score), 2)         AS avg_score,
    SUM(pr.questions_correct)       AS total_correct,
    SUM(pr.questions_total)         AS total_questions,
    SUM(pr.time_spent_sec)          AS total_time_sec
FROM performance_records pr
JOIN learning_modules lm ON lm.id = pr.module_id
JOIN topics t ON t.id = lm.topic_id
GROUP BY pr.module_id, lm.code, lm.title, t.code;

-- ============================================================
-- SESSION AI ANALYSES
-- ============================================================

CREATE TABLE session_analyses (
    id              SERIAL PRIMARY KEY,
    session_id      INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    analysis_json   JSONB NOT NULL,
    model_used      VARCHAR(60) NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(session_id)
);

-- ============================================================
-- INDEXES (11)
-- ============================================================

CREATE INDEX idx_learning_modules_topic       ON learning_modules(topic_id);
CREATE INDEX idx_learning_outcomes_module      ON learning_outcomes(module_id);
CREATE INDEX idx_plan_entries_plan_date        ON plan_entries(plan_id, scheduled_date);
CREATE INDEX idx_srs_queue_user_next          ON srs_queue(user_id, next_review);
CREATE INDEX idx_sessions_user_started        ON sessions(user_id, started_at);
CREATE INDEX idx_performance_session          ON performance_records(session_id);
CREATE INDEX idx_question_attempts_session    ON question_attempts(session_id);
CREATE INDEX idx_progress_user_date           ON progress_snapshots(user_id, snapshot_date);
CREATE INDEX idx_lm_mastery_user              ON lm_mastery(user_id, module_id);
CREATE INDEX idx_alerts_user_unread           ON alerts(user_id) WHERE is_read = false;
CREATE INDEX idx_weakness_user_unresolved     ON weakness_log(user_id) WHERE resolved = false;
CREATE INDEX idx_session_analyses_session     ON session_analyses(session_id);

-- ──────────────────────────────────────────────────────────────────────────
-- System errors — tech errors captured automatically (frontend + backend).
-- Distinct from study errors (CFA mistakes manually debriefed) which live in
-- frontend localStorage. user_id is nullable because some errors are captured
-- before auth resolves (e.g., login page exceptions).
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE system_errors (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
    source      VARCHAR(20)  NOT NULL CHECK (source IN ('frontend','backend')),
    kind        VARCHAR(40)  NOT NULL,
    message     TEXT         NOT NULL,
    stack       TEXT,
    context     JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_system_errors_created_at  ON system_errors(created_at DESC);
CREATE INDEX idx_system_errors_user        ON system_errors(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_system_errors_kind        ON system_errors(kind);
