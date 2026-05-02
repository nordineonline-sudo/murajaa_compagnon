import { SQLiteDatabase } from 'expo-sqlite';

const CURRENT_VERSION = 1;

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Create version table if needed
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM db_version LIMIT 1'
  );
  const currentVersion = row?.version ?? 0;

  if (currentVersion < 1) {
    await migrate_v1(db);
    await db.runAsync(
      'INSERT OR REPLACE INTO db_version (version) VALUES (?)',
      [1]
    );
  }

  // Future migrations: if (currentVersion < 2) { await migrate_v2(db); ... }
}

async function migrate_v1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- ── User settings ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS user_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- ── Plans ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS plans (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at        TEXT    NOT NULL,
      start_date        TEXT    NOT NULL,
      nb_days           INTEGER NOT NULL,
      review_unit       TEXT    NOT NULL,
      quantity_per_day  INTEGER NOT NULL,
      backlog_strategy  TEXT    NOT NULL DEFAULT 'postpone',
      active            INTEGER NOT NULL DEFAULT 1
    );

    -- ── Tasks ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS tasks (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id        INTEGER NOT NULL REFERENCES plans(id),
      scheduled_date TEXT    NOT NULL,
      unit_type      TEXT    NOT NULL,
      unit_id        INTEGER NOT NULL,
      label          TEXT    NOT NULL,
      status         TEXT    NOT NULL DEFAULT 'planned',
      order_index    INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_plan ON tasks(plan_id);

    -- ── Completion events ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS completion_events (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id          INTEGER NOT NULL REFERENCES tasks(id),
      completed_at     TEXT    NOT NULL,
      duration_seconds INTEGER,
      note             TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_ce_task ON completion_events(task_id);

    -- ── Daily stats cache ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS daily_stats (
      date           TEXT PRIMARY KEY,
      planned_count  INTEGER NOT NULL DEFAULT 0,
      done_count     INTEGER NOT NULL DEFAULT 0,
      skipped_count  INTEGER NOT NULL DEFAULT 0
    );
  `);
}
