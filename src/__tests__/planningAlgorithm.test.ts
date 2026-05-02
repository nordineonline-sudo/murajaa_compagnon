import {
  generatePlanTasks,
  handleBacklog,
  addDays,
} from '../services/planningAlgorithm';
import type { PlanUnit } from '../services/planningAlgorithm';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeUnits(n: number, type: 'page' | 'line' = 'page'): PlanUnit[] {
  return Array.from({ length: n }, (_, i) => ({
    unitType: type,
    unitId: i + 1,
    label: `${type} ${i + 1}`,
  }));
}

const BASE_INPUT = {
  planId: 1,
  startDate: '2025-01-01',
  nbDays: 7,
  quantityPerDay: 2,
  backlogStrategy: 'postpone' as const,
};

// ─── generatePlanTasks ────────────────────────────────────────────────────────

describe('generatePlanTasks', () => {
  test('returns empty array when no units', () => {
    const tasks = generatePlanTasks({ ...BASE_INPUT, units: [] });
    expect(tasks).toHaveLength(0);
  });

  test('returns empty array when nbDays = 0', () => {
    const tasks = generatePlanTasks({ ...BASE_INPUT, units: makeUnits(5), nbDays: 0 });
    expect(tasks).toHaveLength(0);
  });

  test('distributes units evenly across days', () => {
    // 6 units, 3 days, 2/day → 2 per day
    const tasks = generatePlanTasks({
      ...BASE_INPUT,
      units: makeUnits(6),
      nbDays: 3,
      quantityPerDay: 2,
    });
    expect(tasks).toHaveLength(6);

    const day1 = tasks.filter(t => t.scheduledDate === '2025-01-01');
    const day2 = tasks.filter(t => t.scheduledDate === '2025-01-02');
    const day3 = tasks.filter(t => t.scheduledDate === '2025-01-03');
    expect(day1).toHaveLength(2);
    expect(day2).toHaveLength(2);
    expect(day3).toHaveLength(2);
  });

  test('all tasks have status "planned"', () => {
    const tasks = generatePlanTasks({ ...BASE_INPUT, units: makeUnits(4) });
    expect(tasks.every(t => t.status === 'planned')).toBe(true);
  });

  test('stops before nbDays if units are exhausted', () => {
    // 3 units, 7 days, 1/day → only 3 tasks
    const tasks = generatePlanTasks({
      ...BASE_INPUT,
      units: makeUnits(3),
      nbDays: 7,
      quantityPerDay: 1,
    });
    expect(tasks).toHaveLength(3);
    // All on first 3 days
    const dates = [...new Set(tasks.map(t => t.scheduledDate))].sort();
    expect(dates).toEqual(['2025-01-01', '2025-01-02', '2025-01-03']);
  });

  test('appends extra units to last day when units > nbDays * qty', () => {
    // 10 units, 2 days, 3/day → first 3 on day1, next 3 on day2, remaining 4 on day2
    const tasks = generatePlanTasks({
      ...BASE_INPUT,
      units: makeUnits(10),
      nbDays: 2,
      quantityPerDay: 3,
    });
    expect(tasks).toHaveLength(10);
    const day1 = tasks.filter(t => t.scheduledDate === '2025-01-01');
    const day2 = tasks.filter(t => t.scheduledDate === '2025-01-02');
    expect(day1).toHaveLength(3);
    expect(day2).toHaveLength(7); // 3 + 4 overflow
  });

  test('orderIndex is sequential within each day', () => {
    const tasks = generatePlanTasks({ ...BASE_INPUT, units: makeUnits(6), nbDays: 2, quantityPerDay: 3 });
    const day1 = tasks.filter(t => t.scheduledDate === '2025-01-01');
    expect(day1.map(t => t.orderIndex)).toEqual([0, 1, 2]);
  });

  test('assigns correct planId', () => {
    const tasks = generatePlanTasks({ ...BASE_INPUT, planId: 42, units: makeUnits(3) });
    expect(tasks.every(t => t.planId === 42)).toBe(true);
  });

  test('correct dates for startDate', () => {
    const tasks = generatePlanTasks({
      ...BASE_INPUT,
      units: makeUnits(3),
      nbDays: 3,
      quantityPerDay: 1,
      startDate: '2024-12-30',
    });
    const dates = tasks.map(t => t.scheduledDate);
    expect(dates).toEqual(['2024-12-30', '2024-12-31', '2025-01-01']);
  });

  test('1 unit per day works correctly', () => {
    const tasks = generatePlanTasks({
      ...BASE_INPUT,
      units: makeUnits(5),
      nbDays: 5,
      quantityPerDay: 1,
    });
    expect(tasks).toHaveLength(5);
    const dates = tasks.map(t => t.scheduledDate);
    expect(dates).toEqual([
      '2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04', '2025-01-05',
    ]);
  });
});

// ─── handleBacklog ────────────────────────────────────────────────────────────

describe('handleBacklog - postpone', () => {
  test('moves planned tasks from missed date to today', () => {
    const tasks = generatePlanTasks({
      ...BASE_INPUT,
      units: makeUnits(4),
      nbDays: 2,
      quantityPerDay: 2,
    });
    const result = handleBacklog(tasks, '2025-01-01', '2025-01-02', 'postpone');

    const day1 = result.filter(t => t.scheduledDate === '2025-01-01');
    const day2 = result.filter(t => t.scheduledDate === '2025-01-02');
    expect(day1).toHaveLength(0);
    expect(day2).toHaveLength(4);
    // Moved tasks should have status 'backlog'
    const backlog = result.filter(t => t.status === 'backlog');
    expect(backlog).toHaveLength(2);
  });

  test('does not change done tasks', () => {
    const tasks = [
      ...generatePlanTasks({ ...BASE_INPUT, units: makeUnits(2), nbDays: 1, quantityPerDay: 2 }),
    ];
    tasks[0] = { ...tasks[0], status: 'done' };
    const result = handleBacklog(tasks, '2025-01-01', '2025-01-02', 'postpone');

    const doneTask = result.find(t => t.status === 'done');
    expect(doneTask?.scheduledDate).toBe('2025-01-01'); // not moved
  });
});

describe('handleBacklog - spread', () => {
  test('redistributes missed tasks across future days', () => {
    const tasks = generatePlanTasks({
      ...BASE_INPUT,
      units: makeUnits(6),
      nbDays: 3,
      quantityPerDay: 2,
    });
    const result = handleBacklog(tasks, '2025-01-01', '2025-01-02', 'spread');

    const day1 = result.filter(t => t.scheduledDate === '2025-01-01' && t.status === 'planned');
    expect(day1).toHaveLength(0); // planned tasks moved

    const backlogTasks = result.filter(t => t.status === 'backlog');
    expect(backlogTasks).toHaveLength(2);
    // Backlog tasks should be on future dates
    const futureDates = backlogTasks.map(t => t.scheduledDate);
    expect(futureDates.every(d => d >= '2025-01-02')).toBe(true);
  });

  test('puts backlog on today if no future days exist', () => {
    const tasks = generatePlanTasks({
      ...BASE_INPUT,
      units: makeUnits(2),
      nbDays: 1,
      quantityPerDay: 2,
    });
    const result = handleBacklog(tasks, '2025-01-01', '2025-01-02', 'spread');
    const backlog = result.filter(t => t.status === 'backlog');
    expect(backlog.every(t => t.scheduledDate === '2025-01-02')).toBe(true);
  });
});

// ─── addDays helper ───────────────────────────────────────────────────────────

describe('addDays', () => {
  test('adds days correctly', () => {
    expect(addDays('2025-01-01', 5)).toBe('2025-01-06');
    expect(addDays('2025-01-28', 4)).toBe('2025-02-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // leap year
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
  });

  test('handles negative days', () => {
    expect(addDays('2025-01-06', -5)).toBe('2025-01-01');
  });
});
