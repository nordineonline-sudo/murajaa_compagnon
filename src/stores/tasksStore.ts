import { create } from 'zustand';
import type { Task, Plan, CompletionEvent } from '@/types';
import { getDatabase } from '@/db/database';
import {
  getTasksForDate,
  updateTaskStatus,
  insertTasks,
  getActivePlan,
  insertPlan,
  deactivateAllPlans,
  countTasksByStatus,
} from '@/db/repositories/planRepo';
import {
  insertCompletionEvent,
  recalcDailyStats,
} from '@/db/repositories/statsRepo';
import { generatePlanTasks } from '@/services/planningAlgorithm';
import type { PlanUnit } from '@/services/planningAlgorithm';
import { todayDateString } from '@/services/planningAlgorithm';

interface TasksState {
  todayTasks: Task[];
  activePlan: Plan | null;
  todayCounts: { planned: number; done: number; skipped: number; backlog: number };
  loaded: boolean;

  loadToday: () => Promise<void>;
  markTaskDone: (taskId: number, durationSeconds?: number) => Promise<void>;
  markTaskSkipped: (taskId: number) => Promise<void>;
  createPlan: (
    units: PlanUnit[],
    planMeta: Omit<Plan, 'id' | 'createdAt' | 'active'>
  ) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  todayTasks: [],
  activePlan: null,
  todayCounts: { planned: 0, done: 0, skipped: 0, backlog: 0 },
  loaded: false,

  loadToday: async () => {
    const db = await getDatabase();
    const today = todayDateString();
    const [tasks, plan, counts] = await Promise.all([
      getTasksForDate(db, today),
      getActivePlan(db),
      countTasksByStatus(db, today),
    ]);
    set({ todayTasks: tasks, activePlan: plan, todayCounts: counts, loaded: true });
  },

  markTaskDone: async (taskId, durationSeconds) => {
    const db = await getDatabase();
    await updateTaskStatus(db, taskId, 'done');
    await insertCompletionEvent(db, {
      taskId,
      completedAt: new Date().toISOString(),
      durationSeconds: durationSeconds ?? null,
      note: null,
    });
    const today = todayDateString();
    await recalcDailyStats(db, today);

    const [tasks, counts] = await Promise.all([
      getTasksForDate(db, today),
      countTasksByStatus(db, today),
    ]);
    set({ todayTasks: tasks, todayCounts: counts });
  },

  markTaskSkipped: async (taskId) => {
    const db = await getDatabase();
    await updateTaskStatus(db, taskId, 'skipped');
    const today = todayDateString();
    await recalcDailyStats(db, today);

    const [tasks, counts] = await Promise.all([
      getTasksForDate(db, today),
      countTasksByStatus(db, today),
    ]);
    set({ todayTasks: tasks, todayCounts: counts });
  },

  createPlan: async (units, planMeta) => {
    const db = await getDatabase();
    await deactivateAllPlans(db);

    const planId = await insertPlan(db, {
      ...planMeta,
      createdAt: new Date().toISOString(),
      active: true,
    });

    const tasks = generatePlanTasks({
      planId,
      units,
      startDate: planMeta.startDate,
      nbDays: planMeta.nbDays,
      quantityPerDay: planMeta.quantityPerDay,
      backlogStrategy: planMeta.backlogStrategy,
    });

    await insertTasks(db, tasks);

    // Refresh today
    await get().loadToday();
  },
}));
