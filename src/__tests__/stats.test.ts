/**
 * Tests for statistics derivation helpers.
 * These test pure functions; no DB interaction needed.
 */

interface DailyStats {
  date: string;
  plannedCount: number;
  doneCount: number;
  skippedCount: number;
}

// ── Pure helper functions (mirroring statsRepo logic) ──────────────────────────

function computeCompletionRate(stats: DailyStats[]): number {
  const totalPlanned = stats.reduce((s, d) => s + d.plannedCount, 0);
  const totalDone = stats.reduce((s, d) => s + d.doneCount, 0);
  if (totalPlanned === 0) return 0;
  return Math.round((totalDone / totalPlanned) * 100);
}

function computeBacklogCount(stats: DailyStats[]): number {
  return stats.reduce(
    (sum, d) => sum + Math.max(0, d.plannedCount - d.doneCount - d.skippedCount),
    0
  );
}

function filterDateRange(stats: DailyStats[], from: string, to: string): DailyStats[] {
  return stats.filter(d => d.date >= from && d.date <= to);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('computeCompletionRate', () => {
  test('returns 0 when no stats', () => {
    expect(computeCompletionRate([])).toBe(0);
  });

  test('returns 0 when nothing planned', () => {
    expect(computeCompletionRate([{ date: '2025-01-01', plannedCount: 0, doneCount: 0, skippedCount: 0 }])).toBe(0);
  });

  test('returns 100 when all done', () => {
    const stats: DailyStats[] = [
      { date: '2025-01-01', plannedCount: 5, doneCount: 5, skippedCount: 0 },
      { date: '2025-01-02', plannedCount: 3, doneCount: 3, skippedCount: 0 },
    ];
    expect(computeCompletionRate(stats)).toBe(100);
  });

  test('rounds correctly', () => {
    const stats: DailyStats[] = [
      { date: '2025-01-01', plannedCount: 3, doneCount: 1, skippedCount: 0 },
    ];
    // 1/3 = 33.33... → rounds to 33
    expect(computeCompletionRate(stats)).toBe(33);
  });

  test('aggregates across multiple days', () => {
    const stats: DailyStats[] = [
      { date: '2025-01-01', plannedCount: 4, doneCount: 2, skippedCount: 0 },
      { date: '2025-01-02', plannedCount: 4, doneCount: 4, skippedCount: 0 },
    ];
    // 6/8 = 75%
    expect(computeCompletionRate(stats)).toBe(75);
  });
});

describe('computeBacklogCount', () => {
  test('returns 0 when everything done', () => {
    const stats: DailyStats[] = [
      { date: '2025-01-01', plannedCount: 3, doneCount: 3, skippedCount: 0 },
    ];
    expect(computeBacklogCount(stats)).toBe(0);
  });

  test('counts uncompleted non-skipped tasks as backlog', () => {
    const stats: DailyStats[] = [
      { date: '2025-01-01', plannedCount: 5, doneCount: 2, skippedCount: 1 },
      // backlog = 5 - 2 - 1 = 2
    ];
    expect(computeBacklogCount(stats)).toBe(2);
  });

  test('does not count negative backlog', () => {
    const stats: DailyStats[] = [
      { date: '2025-01-01', plannedCount: 1, doneCount: 2, skippedCount: 0 },
    ];
    expect(computeBacklogCount(stats)).toBe(0);
  });

  test('accumulates across days', () => {
    const stats: DailyStats[] = [
      { date: '2025-01-01', plannedCount: 3, doneCount: 1, skippedCount: 0 }, // backlog 2
      { date: '2025-01-02', plannedCount: 3, doneCount: 2, skippedCount: 1 }, // backlog 0
      { date: '2025-01-03', plannedCount: 5, doneCount: 2, skippedCount: 0 }, // backlog 3
    ];
    expect(computeBacklogCount(stats)).toBe(5);
  });
});

describe('filterDateRange', () => {
  const data: DailyStats[] = [
    { date: '2025-01-01', plannedCount: 1, doneCount: 1, skippedCount: 0 },
    { date: '2025-01-05', plannedCount: 2, doneCount: 1, skippedCount: 0 },
    { date: '2025-01-10', plannedCount: 3, doneCount: 2, skippedCount: 0 },
    { date: '2025-01-15', plannedCount: 1, doneCount: 0, skippedCount: 1 },
  ];

  test('returns all within range', () => {
    const result = filterDateRange(data, '2025-01-01', '2025-01-10');
    expect(result).toHaveLength(3);
  });

  test('returns empty when no data in range', () => {
    const result = filterDateRange(data, '2025-02-01', '2025-02-28');
    expect(result).toHaveLength(0);
  });

  test('handles single date range', () => {
    const result = filterDateRange(data, '2025-01-05', '2025-01-05');
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2025-01-05');
  });
});
