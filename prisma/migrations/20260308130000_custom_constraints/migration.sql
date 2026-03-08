-- ============================================================
-- 0002_custom_constraints
-- Custom SQL that Prisma cannot generate:
--   1) Global revision sequence + trigger
--   2) CHECK constraints for events (all_day consistency)
--   3) Partial indexes for sync & range queries
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Global revision sequence
-- ────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS app_revision_seq START 1;

-- ────────────────────────────────────────────────────────────
-- 2. Revision trigger function
--    Sets revision = nextval('app_revision_seq') on every
--    INSERT or UPDATE of rows in sync-relevant tables.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_revision()
RETURNS TRIGGER AS $$
BEGIN
  NEW.revision := nextval('app_revision_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to sync-relevant tables
CREATE TRIGGER trg_calendars_revision
  BEFORE INSERT OR UPDATE ON "calendars"
  FOR EACH ROW EXECUTE FUNCTION set_revision();

CREATE TRIGGER trg_calendar_members_revision
  BEFORE INSERT OR UPDATE ON "calendar_members"
  FOR EACH ROW EXECUTE FUNCTION set_revision();

CREATE TRIGGER trg_invites_revision
  BEFORE INSERT OR UPDATE ON "invites"
  FOR EACH ROW EXECUTE FUNCTION set_revision();

CREATE TRIGGER trg_events_revision
  BEFORE INSERT OR UPDATE ON "events"
  FOR EACH ROW EXECUTE FUNCTION set_revision();

-- ────────────────────────────────────────────────────────────
-- 3. CHECK constraints on events
--    Enforce all_day vs timed field consistency
-- ────────────────────────────────────────────────────────────

-- 3a. Timed event: all_day=false => start_at_utc/end_at_utc NOT NULL, date fields NULL
ALTER TABLE "events"
  ADD CONSTRAINT chk_events_timed
  CHECK (
    all_day = true
    OR (
      start_at_utc IS NOT NULL
      AND end_at_utc IS NOT NULL
      AND start_date IS NULL
      AND end_date IS NULL
    )
  );

-- 3b. All-day event: all_day=true => start_date/end_date NOT NULL, utc fields NULL
ALTER TABLE "events"
  ADD CONSTRAINT chk_events_allday
  CHECK (
    all_day = false
    OR (
      start_date IS NOT NULL
      AND end_date IS NOT NULL
      AND start_at_utc IS NULL
      AND end_at_utc IS NULL
    )
  );

-- 3c. Timed: end > start
ALTER TABLE "events"
  ADD CONSTRAINT chk_events_timed_range
  CHECK (
    all_day = true
    OR end_at_utc > start_at_utc
  );

-- 3d. All-day: end > start (end_date is exclusive, so must be strictly greater)
ALTER TABLE "events"
  ADD CONSTRAINT chk_events_allday_range
  CHECK (
    all_day = false
    OR end_date > start_date
  );

-- ────────────────────────────────────────────────────────────
-- 4. Partial indexes for query performance
-- ────────────────────────────────────────────────────────────

-- 4a. Active timed events: range queries on (calendar_id, start_at_utc, end_at_utc)
--     Only non-deleted, non-all-day events
CREATE INDEX idx_events_active_timed_range
  ON "events" ("calendar_id", "start_at_utc", "end_at_utc")
  WHERE deleted_at IS NULL AND all_day = false;

-- 4b. Active all-day events: range queries on (calendar_id, start_date, end_date)
--     Only non-deleted, all-day events
CREATE INDEX idx_events_active_allday_range
  ON "events" ("calendar_id", "start_date", "end_date")
  WHERE deleted_at IS NULL AND all_day = true;

-- 4c. Sync index for active records: fetch changes since a revision
--     Used by GET /sync?calendarId=...&since=...
CREATE INDEX idx_events_sync_active
  ON "events" ("calendar_id", "revision")
  WHERE deleted_at IS NULL;

-- 4d. Sync index for deleted records: fetch deletions since a revision
--     Clients need to know which events were soft-deleted
CREATE INDEX idx_events_sync_deleted
  ON "events" ("calendar_id", "revision")
  WHERE deleted_at IS NOT NULL;

-- 4e. Sync indexes for other sync-relevant tables
CREATE INDEX idx_calendars_sync
  ON "calendars" ("revision");

CREATE INDEX idx_calendar_members_sync
  ON "calendar_members" ("calendar_id", "revision");

CREATE INDEX idx_invites_sync
  ON "invites" ("calendar_id", "revision");
