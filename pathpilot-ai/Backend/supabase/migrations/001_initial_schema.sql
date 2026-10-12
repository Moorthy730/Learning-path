-- ============================================================================
-- PathPilot AI — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Run this in the Supabase SQL Editor or via CLI: supabase db push
-- ============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── learning_paths ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_paths (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title               TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
    goal                TEXT NOT NULL CHECK (char_length(goal) BETWEEN 3 AND 200),
    current_level       TEXT NOT NULL CHECK (current_level IN ('beginner', 'intermediate', 'advanced')),
    existing_skills     JSONB NOT NULL DEFAULT '[]',
    daily_hours         NUMERIC(4,1) NOT NULL CHECK (daily_hours > 0 AND daily_hours <= 12),
    duration_weeks      INTEGER NOT NULL CHECK (duration_weeks >= 1 AND duration_weeks <= 104),
    learning_format     TEXT NOT NULL DEFAULT 'mixed'
                            CHECK (learning_format IN ('video', 'articles', 'hands-on', 'mixed')),
    learning_objective  TEXT NOT NULL DEFAULT 'job-readiness'
                            CHECK (learning_objective IN ('job-readiness', 'academic', 'career-change', 'personal')),
    summary             TEXT,
    roadmap             JSONB NOT NULL DEFAULT '{}',
    status              TEXT NOT NULL DEFAULT 'not-started'
                            CHECK (status IN ('not-started', 'in-progress', 'completed', 'paused')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_status  ON learning_paths(status);

-- ── modules ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path_id         UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
    description     TEXT NOT NULL,
    order_index     INTEGER NOT NULL CHECK (order_index >= 1),
    estimated_hours NUMERIC(6,1) NOT NULL CHECK (estimated_hours > 0),
    project         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(path_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_modules_path_id ON modules(path_id);

-- ── lessons ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id           UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title               TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
    description         TEXT NOT NULL,
    estimated_hours     NUMERIC(5,1) NOT NULL CHECK (estimated_hours > 0),
    resource_url        TEXT,
    completion_criteria TEXT NOT NULL,
    order_index         INTEGER NOT NULL CHECK (order_index >= 1),
    completed           BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(module_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id  ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_completed  ON lessons(completed);

-- ── assessments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    path_id         UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    module_id       UUID REFERENCES modules(id) ON DELETE SET NULL,
    score           INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    answers         JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_path_id ON assessments(path_id);

-- ── Updated-at trigger function ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_learning_paths_updated_at
    BEFORE UPDATE ON learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS)
-- Every user can only access their own rows.
-- ============================================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths   ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments      ENABLE ROW LEVEL SECURITY;

-- ── profiles policies ────────────────────────────────────────────────────────
CREATE POLICY "profiles: owner select"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "profiles: owner insert"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: owner update"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ── learning_paths policies ───────────────────────────────────────────────────
CREATE POLICY "paths: owner select"
    ON learning_paths FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "paths: owner insert"
    ON learning_paths FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "paths: owner update"
    ON learning_paths FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "paths: owner delete"
    ON learning_paths FOR DELETE
    USING (user_id = auth.uid());

-- ── modules policies (ownership via learning_paths join) ─────────────────────
CREATE POLICY "modules: owner select"
    ON modules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM learning_paths p
            WHERE p.id = modules.path_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "modules: owner insert"
    ON modules FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM learning_paths p
            WHERE p.id = path_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "modules: owner update"
    ON modules FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM learning_paths p
            WHERE p.id = modules.path_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "modules: owner delete"
    ON modules FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM learning_paths p
            WHERE p.id = modules.path_id AND p.user_id = auth.uid()
        )
    );

-- ── lessons policies (ownership via modules → learning_paths join) ────────────
CREATE POLICY "lessons: owner select"
    ON lessons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM modules m
            JOIN learning_paths p ON p.id = m.path_id
            WHERE m.id = lessons.module_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "lessons: owner update"
    ON lessons FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM modules m
            JOIN learning_paths p ON p.id = m.path_id
            WHERE m.id = lessons.module_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "lessons: owner insert"
    ON lessons FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM modules m
            JOIN learning_paths p ON p.id = m.path_id
            WHERE m.id = module_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "lessons: owner delete"
    ON lessons FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM modules m
            JOIN learning_paths p ON p.id = m.path_id
            WHERE m.id = lessons.module_id AND p.user_id = auth.uid()
        )
    );

-- ── assessments policies ─────────────────────────────────────────────────────
CREATE POLICY "assessments: owner select"
    ON assessments FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "assessments: owner insert"
    ON assessments FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Grants to authenticated role (used by Supabase client with anon key)
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON learning_paths TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON modules        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lessons        TO authenticated;
GRANT SELECT, INSERT               ON assessments      TO authenticated;

-- Service role (used by backend admin client) bypasses RLS
-- This is intentional — the backend enforces ownership in application code
-- as a second layer of defence.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
