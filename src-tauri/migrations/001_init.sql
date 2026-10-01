-- TaskEase 本地数据库初始结构
-- 说明：本应用为单机单用户，不再有 user_id 等账号相关字段；
--       todo 采用软删除（status = 'deleted'），番茄钟会话采用物理删除。

CREATE TABLE IF NOT EXISTS todos (
  id                    TEXT    PRIMARY KEY NOT NULL,
  title                 TEXT    NOT NULL DEFAULT '',
  status                TEXT    NOT NULL DEFAULT 'pending',
  estimated_hours       REAL    NOT NULL DEFAULT 0,
  ddl                   TEXT,
  remark                TEXT,
  repeat_rule           TEXT    NOT NULL DEFAULT 'none',
  repeat_until_date     TEXT    NOT NULL DEFAULT '',
  priority              INTEGER NOT NULL DEFAULT 0,
  label                 TEXT,
  progress_percent      REAL    NOT NULL DEFAULT 0,
  pomodoro_total_seconds REAL   NOT NULL DEFAULT 0,
  created_at            TEXT,
  deleted_at            TEXT
);

CREATE INDEX IF NOT EXISTS idx_todos_status  ON todos (status);
CREATE INDEX IF NOT EXISTS idx_todos_ddl     ON todos (ddl);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id               TEXT PRIMARY KEY NOT NULL,
  session_key      TEXT NOT NULL DEFAULT '',
  task_id          TEXT NOT NULL,
  duration_seconds REAL NOT NULL DEFAULT 0,
  start_time       TEXT,
  end_time         TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_task  ON pomodoro_sessions (task_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON pomodoro_sessions (start_time);

-- 标签库（用户手动维护的自定义标签，与任务上的 label 字段互补）
CREATE TABLE IF NOT EXISTS task_labels (
  label      TEXT    PRIMARY KEY NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 应用级元信息（schema 版本、上次导出时间等）
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT
);
