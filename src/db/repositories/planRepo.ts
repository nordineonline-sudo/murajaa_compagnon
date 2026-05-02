import { SQLiteDatabase } from 'expo-sqlite';
import type { Task, TaskStatus, Plan } from '@/types';

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function insertPlan(db: SQLiteDatabase, plan: Omit<Plan, 'id'>): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO plans
       (created_at, start_date, nb_days, review_unit, quantity_per_day, backlog_strategy, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      plan.createdAt, plan.startDate, plan.nbDays, plan.reviewUnit,
      plan.quantityPerDay, plan.backlogStrategy, plan.active ? 1 : 0,
    ]
  );
  return result.lastInsertRowId;
}

export async function getActivePlan(db: SQLiteDatabase): Promise<Plan | null> {
  const r = await db.getFirstAsync<{
    id: number; created_at: string; start_date: string; nb_days: number;
    review_unit: string; quantity_per_day: number; backlog_strategy: string; active: number;
  }>('SELECT * FROM plans WHERE active = 1 ORDER BY id DESC LIMIT 1');
  if (!r) return null;
  return mapPlan(r);
}

export async function deactivateAllPlans(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('UPDATE plans SET active = 0');
}

function mapPlan(r: {
  id: number; created_at: string; start_date: string; nb_days: number;
  review_unit: string; quantity_per_day: number; backlog_strategy: string; active: number;
}): Plan {
  return {
    id: r.id, createdAt: r.created_at, startDate: r.start_date,
    nbDays: r.nb_days, reviewUnit: r.review_unit as Plan['reviewUnit'],
    quantityPerDay: r.quantity_per_day,
    backlogStrategy: r.backlog_strategy as 'postpone' | 'spread',
    active: r.active === 1,
  };
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function insertTasks(
  db: SQLiteDatabase,
  tasks: Omit<Task, 'id'>[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const t of tasks) {
      await db.runAsync(
        `INSERT INTO tasks
           (plan_id, scheduled_date, unit_type, unit_id, label, status, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [t.planId, t.scheduledDate, t.unitType, t.unitId, t.label, t.status, t.orderIndex]
      );
    }
  });
}

export async function getTasksForDate(
  db: SQLiteDatabase,
  date: string
): Promise<Task[]> {
  const rows = await db.getAllAsync<{
    id: number; plan_id: number; scheduled_date: string; unit_type: string;
    unit_id: number; label: string; status: string; order_index: number;
  }>('SELECT * FROM tasks WHERE scheduled_date = ? ORDER BY order_index', [date]);
  return rows.map(mapTask);
}

export async function getAllTasksForPlan(
  db: SQLiteDatabase,
  planId: number
): Promise<Task[]> {
  const rows = await db.getAllAsync<{
    id: number; plan_id: number; scheduled_date: string; unit_type: string;
    unit_id: number; label: string; status: string; order_index: number;
  }>('SELECT * FROM tasks WHERE plan_id = ? ORDER BY scheduled_date, order_index', [planId]);
  return rows.map(mapTask);
}

export async function updateTaskStatus(
  db: SQLiteDatabase,
  taskId: number,
  status: TaskStatus
): Promise<void> {
  await db.runAsync('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
}

export async function countTasksByStatus(
  db: SQLiteDatabase,
  date: string
): Promise<{ planned: number; done: number; skipped: number; backlog: number }> {
  const rows = await db.getAllAsync<{ status: string; cnt: number }>(
    'SELECT status, COUNT(*) as cnt FROM tasks WHERE scheduled_date = ? GROUP BY status',
    [date]
  );
  const counts = { planned: 0, done: 0, skipped: 0, backlog: 0 };
  for (const r of rows) {
    counts[r.status as TaskStatus] = r.cnt;
  }
  return counts;
}

/** Reschedule all 'planned' tasks from old date to new date (backlog postpone). */
export async function postponeTasksFromDate(
  db: SQLiteDatabase,
  fromDate: string,
  toDate: string
): Promise<void> {
  await db.runAsync(
    `UPDATE tasks SET scheduled_date = ? WHERE scheduled_date = ? AND status = 'planned'`,
    [toDate, fromDate]
  );
}

function mapTask(r: {
  id: number; plan_id: number; scheduled_date: string; unit_type: string;
  unit_id: number; label: string; status: string; order_index: number;
}): Task {
  return {
    id: r.id, planId: r.plan_id, scheduledDate: r.scheduled_date,
    unitType: r.unit_type as Task['unitType'], unitId: r.unit_id,
    label: r.label, status: r.status as TaskStatus, orderIndex: r.order_index,
  };
}
