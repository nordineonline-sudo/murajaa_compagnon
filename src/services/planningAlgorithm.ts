import type { Task, ReviewUnit, BacklogStrategy } from '@/types';

export interface PlanUnit {
  unitType: ReviewUnit;
  unitId: number;
  label: string;
}

export interface PlanInput {
  planId: number;
  units: PlanUnit[];
  startDate: string;        // YYYY-MM-DD
  nbDays: number;
  quantityPerDay: number;
  backlogStrategy: BacklogStrategy;
}

/**
 * Generates a deterministic list of tasks spread across days.
 *
 * Default strategy: round-robin fill.
 *   - Divide units evenly across `nbDays`.
 *   - Each day gets at most `quantityPerDay` tasks.
 *   - Remaining units are appended to the last day if quantityPerDay * nbDays < units.length.
 *
 * @param input Plan parameters
 * @returns Array of Task objects (without id)
 */
export function generatePlanTasks(
  input: PlanInput
): Omit<Task, 'id'>[] {
  const { planId, units, startDate, nbDays, quantityPerDay, backlogStrategy } = input;

  if (units.length === 0 || nbDays <= 0 || quantityPerDay <= 0) {
    return [];
  }

  const tasks: Omit<Task, 'id'>[] = [];
  let unitIndex = 0;
  const startMs = dateToMs(startDate);

  for (let day = 0; day < nbDays; day++) {
    if (unitIndex >= units.length) break;

    const date = msToDateString(startMs + day * 86_400_000);
    let orderIndex = 0;

    for (let q = 0; q < quantityPerDay; q++) {
      if (unitIndex >= units.length) break;

      const unit = units[unitIndex++];
      tasks.push({
        planId,
        scheduledDate: date,
        unitType: unit.unitType,
        unitId: unit.unitId,
        label: unit.label,
        status: 'planned',
        orderIndex: orderIndex++,
      });
    }
  }

  // If there are remaining units (more units than days*qty), append to last day.
  if (unitIndex < units.length) {
    const lastDate = msToDateString(startMs + (nbDays - 1) * 86_400_000);
    let orderIndex = tasks.filter(t => t.scheduledDate === lastDate).length;
    while (unitIndex < units.length) {
      const unit = units[unitIndex++];
      tasks.push({
        planId,
        scheduledDate: lastDate,
        unitType: unit.unitType,
        unitId: unit.unitId,
        label: unit.label,
        status: 'planned',
        orderIndex: orderIndex++,
      });
    }
  }

  return tasks;
}

/**
 * Handles backlog tasks for a missed day.
 *
 * "postpone": move all planned/backlog tasks from missedDate to tomorrowDate.
 * "spread": re-distribute backlog tasks across remaining days.
 */
export function handleBacklog(
  tasks: Omit<Task, 'id'>[],
  missedDate: string,
  todayDate: string,
  strategy: BacklogStrategy
): Omit<Task, 'id'>[] {
  if (strategy === 'postpone') {
    return tasks.map(t =>
      t.scheduledDate === missedDate && t.status === 'planned'
        ? { ...t, scheduledDate: todayDate, status: 'backlog' as const }
        : t
    );
  }

  // spread: collect missed tasks
  const missed = tasks.filter(
    t => t.scheduledDate === missedDate && t.status === 'planned'
  );
  const remaining = tasks.filter(
    t => !(t.scheduledDate === missedDate && t.status === 'planned')
  );

  // Find future dates (> missedDate)
  const futureDates = [
    ...new Set(
      remaining
        .filter(t => t.scheduledDate > missedDate)
        .map(t => t.scheduledDate)
    ),
  ].sort();

  if (futureDates.length === 0) {
    // No future days — put on today as backlog
    const extras = missed.map(t => ({
      ...t, scheduledDate: todayDate, status: 'backlog' as const,
    }));
    return [...remaining, ...extras];
  }

  // Distribute missed tasks across future dates
  const redistributed = missed.map((t, i) => ({
    ...t,
    scheduledDate: futureDates[i % futureDates.length],
    status: 'backlog' as const,
  }));

  return [...remaining, ...redistributed];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateToMs(dateString: string): number {
  return new Date(dateString + 'T00:00:00Z').getTime();
}

function msToDateString(ms: number): string {
  return new Date(ms).toISOString().substring(0, 10);
}

export function addDays(dateString: string, days: number): string {
  return msToDateString(dateToMs(dateString) + days * 86_400_000);
}

export function todayDateString(): string {
  return new Date().toISOString().substring(0, 10);
}
