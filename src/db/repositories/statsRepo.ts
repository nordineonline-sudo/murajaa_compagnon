import { SQLiteDatabase } from 'expo-sqlite';
import type { CompletionEvent, DailyStats } from '@/types';

// ─── Completion events ────────────────────────────────────────────────────────

export async function insertCompletionEvent(
  db: SQLiteDatabase,
  event: Omit<CompletionEvent, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO completion_events (task_id, completed_at, duration_seconds, note)
     VALUES (?, ?, ?, ?)`,
    [event.taskId, event.completedAt, event.durationSeconds ?? null, event.note ?? null]
  );
  return result.lastInsertRowId;
}

export async function getCompletionEventsForTask(
  db: SQLiteDatabase,
  taskId: number
): Promise<CompletionEvent[]> {
  const rows = await db.getAllAsync<{
    id: number; task_id: number; completed_at: string;
    duration_seconds: number | null; note: string | null;
  }>('SELECT * FROM completion_events WHERE task_id = ? ORDER BY completed_at', [taskId]);
  return rows.map(r => ({
    id: r.id, taskId: r.task_id, completedAt: r.completed_at,
    durationSeconds: r.duration_seconds, note: r.note,
  }));
}

// ─── Daily stats ──────────────────────────────────────────────────────────────

export async function upsertDailyStats(
  db: SQLiteDatabase,
  stats: DailyStats
): Promise<void> {
  await db.runAsync(
    `INSERT INTO daily_stats (date, planned_count, done_count, skipped_count)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       planned_count = excluded.planned_count,
       done_count    = excluded.done_count,
       skipped_count = excluded.skipped_count`,
    [stats.date, stats.plannedCount, stats.doneCount, stats.skippedCount]
  );
}

export async function getDailyStats(
  db: SQLiteDatabase,
  fromDate: string,
  toDate: string
): Promise<DailyStats[]> {
  const rows = await db.getAllAsync<{
    date: string; planned_count: number; done_count: number; skipped_count: number;
  }>(
    'SELECT * FROM daily_stats WHERE date >= ? AND date <= ? ORDER BY date',
    [fromDate, toDate]
  );
  return rows.map(r => ({
    date: r.date, plannedCount: r.planned_count,
    doneCount: r.done_count, skippedCount: r.skipped_count,
  }));
}

export async function recalcDailyStats(
  db: SQLiteDatabase,
  date: string
): Promise<DailyStats> {
  const row = await db.getFirstAsync<{
    planned: number; done: number; skipped: number;
  }>(`
    SELECT
      SUM(CASE WHEN status IN ('planned','backlog') THEN 1 ELSE 0 END) AS planned,
      SUM(CASE WHEN status = 'done'    THEN 1 ELSE 0 END) AS done,
      SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped
    FROM tasks
    WHERE scheduled_date = ?
  `, [date]);

  const stats: DailyStats = {
    date,
    plannedCount: row?.planned ?? 0,
    doneCount: row?.done ?? 0,
    skippedCount: row?.skipped ?? 0,
  };
  await upsertDailyStats(db, stats);
  return stats;
}

/** Aggregate daily stats into weekly buckets. */
export async function getWeeklyStats(
  db: SQLiteDatabase,
  weeks: number = 8
): Promise<{ weekStart: string; plannedCount: number; doneCount: number }[]> {
  const rows = await db.getAllAsync<{
    week_start: string; planned: number; done: number;
  }>(`
    SELECT
      date(date, 'weekday 1', '-7 days') AS week_start,
      SUM(planned_count) AS planned,
      SUM(done_count)    AS done
    FROM daily_stats
    WHERE date >= date('now', ?)
    GROUP BY week_start
    ORDER BY week_start
  `, [`-${weeks * 7} days`]);
  return rows.map(r => ({
    weekStart: r.week_start,
    plannedCount: r.planned,
    doneCount: r.done,
  }));
}
