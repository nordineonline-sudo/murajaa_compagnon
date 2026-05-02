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
    -- ── Quran entities ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS surahs (
      id               INTEGER PRIMARY KEY,
      name_arabic      TEXT    NOT NULL,
      name_translit    TEXT    NOT NULL,
      name_fr          TEXT    NOT NULL,
      verse_count      INTEGER NOT NULL,
      revelation_type  TEXT    NOT NULL,
      start_page       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ayahs (
      id               INTEGER PRIMARY KEY,
      surah_id         INTEGER NOT NULL REFERENCES surahs(id),
      number_in_surah  INTEGER NOT NULL,
      arabic           TEXT    NOT NULL,
      transliteration  TEXT    NOT NULL DEFAULT '',
      phonetic_fr      TEXT    NOT NULL DEFAULT '',
      translation_fr   TEXT    NOT NULL DEFAULT '',
      page_id          INTEGER NOT NULL,
      juz_id           INTEGER NOT NULL,
      hizb_id          INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ayahs_page ON ayahs(page_id);
    CREATE INDEX IF NOT EXISTS idx_ayahs_surah ON ayahs(surah_id);

    CREATE TABLE IF NOT EXISTS pages_mushaf (
      id             INTEGER PRIMARY KEY,
      juz_id         INTEGER NOT NULL,
      hizb_id        INTEGER NOT NULL,
      first_ayah_id  INTEGER NOT NULL,
      last_ayah_id   INTEGER NOT NULL,
      line_count     INTEGER NOT NULL DEFAULT 15
    );

    CREATE TABLE IF NOT EXISTS lines (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id      INTEGER NOT NULL REFERENCES pages_mushaf(id),
      line_index   INTEGER NOT NULL,
      ayah_ids     TEXT    NOT NULL DEFAULT '[]',
      is_basmala   INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_lines_page ON lines(page_id);

    CREATE TABLE IF NOT EXISTS juzs (
      id            INTEGER PRIMARY KEY,
      name_arabic   TEXT    NOT NULL,
      start_page    INTEGER NOT NULL,
      end_page      INTEGER NOT NULL,
      first_ayah_id INTEGER NOT NULL,
      last_ayah_id  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hizbs (
      id            INTEGER PRIMARY KEY,
      juz_id        INTEGER NOT NULL REFERENCES juzs(id),
      start_page    INTEGER NOT NULL,
      end_page      INTEGER NOT NULL,
      first_ayah_id INTEGER NOT NULL,
      last_ayah_id  INTEGER NOT NULL
    );

    -- ── User settings ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS user_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- ── Review selections ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS review_selections (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_type   TEXT    NOT NULL,
      unit_id     INTEGER NOT NULL,
      label       TEXT    NOT NULL,
      selected    INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_sel_unit ON review_selections(unit_type, unit_id);

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

    -- ── Download state ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS download_state (
      id           INTEGER PRIMARY KEY DEFAULT 1,
      status       TEXT    NOT NULL DEFAULT 'idle',
      progress     REAL    NOT NULL DEFAULT 0,
      error_msg    TEXT,
      last_attempt TEXT,
      checksum     TEXT
    );

    INSERT OR IGNORE INTO download_state (id) VALUES (1);
  `);
}
