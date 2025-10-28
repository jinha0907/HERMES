PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS app_notifications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id     TEXT NOT NULL,
  device_type   TEXT NOT NULL,
  app_package   TEXT NOT NULL,
  title         TEXT,
  text          TEXT,
  lines         TEXT,
  posted_at_utc TEXT NOT NULL,
  received_at   INTEGER NOT NULL,
  summary       TEXT                     -- 요약 결과 저장
);

CREATE INDEX IF NOT EXISTS idx_app_notif_time
ON app_notifications(received_at DESC);
ALTER TABLE app_notifications ADD COLUMN sent_count INTEGER DEFAULT 0;
