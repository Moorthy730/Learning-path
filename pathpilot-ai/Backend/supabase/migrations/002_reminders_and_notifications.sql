-- ============================================================================
-- PathPilot AI — Migration 002: Daily Reminders & Notifications
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql
-- ============================================================================

-- ── reminder_preferences ─────────────────────────────────────────────────────
-- Stores each user's notification settings.
-- reminder_time is stored as TIME WITH TIME ZONE offset (e.g. '20:00:00').
-- timezone is an IANA timezone string (e.g. 'Asia/Kolkata').

CREATE TABLE IF NOT EXISTS reminder_preferences (
    user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_time   TIME NOT NULL DEFAULT '20:00:00',   -- local time to send reminder
    timezone        TEXT NOT NULL DEFAULT 'UTC',         -- IANA timezone
    email_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    push_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_reminder_preferences_updated_at
    BEFORE UPDATE ON reminder_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── notifications ─────────────────────────────────────────────────────────────
-- In-app notification history with delivery tracking.

CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('reminder', 'achievement', 'system', 'task_due')),
    title           TEXT NOT NULL CHECK (char_length(title) <= 200),
    message         TEXT NOT NULL CHECK (char_length(message) <= 1000),
    data            JSONB NOT NULL DEFAULT '{}',     -- extra metadata (path_id, lesson_id, etc.)
    read            BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent      BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read       ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ── daily_tasks ───────────────────────────────────────────────────────────────
-- Tasks scheduled for a specific date, derived from a lesson or module.
-- The scheduler creates these automatically; users can also mark them done.

CREATE TABLE IF NOT EXISTS daily_tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    path_id         UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    lesson_id       UUID REFERENCES lessons(id) ON DELETE SET NULL,
    task_type       TEXT NOT NULL CHECK (task_type IN ('lesson', 'project', 'assessment', 'review')),
    title           TEXT NOT NULL CHECK (char_length(title) <= 300),
    scheduled_date  DATE NOT NULL,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    overdue         BOOLEAN NOT NULL DEFAULT FALSE,  -- set by scheduler if past due
    snoozed_until   DATE,                             -- user can snooze to a later date
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, lesson_id, scheduled_date)       -- prevent duplicate tasks per lesson per day
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date    ON daily_tasks(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_path_id      ON daily_tasks(path_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_completed    ON daily_tasks(completed);

CREATE OR REPLACE TRIGGER trg_daily_tasks_updated_at
    BEFORE UPDATE ON daily_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── push_subscriptions ────────────────────────────────────────────────────────
-- Browser push subscription endpoints (WebPush/VAPID).

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint        TEXT NOT NULL,
    p256dh          TEXT NOT NULL,
    auth_key        TEXT NOT NULL,
    user_agent      TEXT,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active  ON push_subscriptions(active);

-- ── reminder_log ─────────────────────────────────────────────────────────────
-- Prevents duplicate reminders: one row per user per date.

CREATE TABLE IF NOT EXISTS reminder_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sent_date   DATE NOT NULL,
    channel     TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'push')),
    status      TEXT NOT NULL CHECK (status IN ('sent', 'skipped', 'failed')),
    details     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, sent_date, channel)
);

CREATE INDEX IF NOT EXISTS idx_reminder_log_user_date ON reminder_log(user_id, sent_date);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_log          ENABLE ROW LEVEL SECURITY;

-- ── reminder_preferences policies ────────────────────────────────────────────
CREATE POLICY "remprefs: owner select"
    ON reminder_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "remprefs: owner insert"
    ON reminder_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "remprefs: owner update"
    ON reminder_preferences FOR UPDATE
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── notifications policies ────────────────────────────────────────────────────
CREATE POLICY "notifs: owner select"
    ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifs: owner update"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- Insert is backend-only (service role), no authenticated insert policy

-- ── daily_tasks policies ──────────────────────────────────────────────────────
CREATE POLICY "tasks: owner select"
    ON daily_tasks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tasks: owner insert"
    ON daily_tasks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks: owner update"
    ON daily_tasks FOR UPDATE
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks: owner delete"
    ON daily_tasks FOR DELETE USING (user_id = auth.uid());

-- ── push_subscriptions policies ───────────────────────────────────────────────
CREATE POLICY "push: owner select"
    ON push_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "push: owner insert"
    ON push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "push: owner update"
    ON push_subscriptions FOR UPDATE
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "push: owner delete"
    ON push_subscriptions FOR DELETE USING (user_id = auth.uid());

-- reminder_log: backend-only writes (no authenticated policy for insert)
CREATE POLICY "remlog: owner select"
    ON reminder_log FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- Grants
-- ============================================================================
GRANT SELECT, INSERT, UPDATE        ON reminder_preferences TO authenticated;
GRANT SELECT, UPDATE                ON notifications         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_tasks          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions   TO authenticated;
GRANT SELECT                        ON reminder_log          TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
