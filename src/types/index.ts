// ─────────────────────────────────────────────
// User preferences
// ─────────────────────────────────────────────

export type ReviewUnit = 'surah' | 'page' | 'juz' | 'hizb' | 'line';
export type BacklogStrategy = 'postpone' | 'spread';

export interface PlanningSettings {
  reviewUnit: ReviewUnit;
  quantityPerDay: number;   // e.g. 5 lines/day or 1 page/day
  planDurationDays: number;
  startDate: string;        // ISO date string YYYY-MM-DD
  notificationHours: number[]; // e.g. [7, 20] → 07:00 & 20:00
  backlogStrategy: BacklogStrategy;
}

export interface UserSettings {
  planning: PlanningSettings;
  onboardingComplete: boolean;
}

// ─────────────────────────────────────────────
// Plan & tasks
// ─────────────────────────────────────────────

export type TaskStatus = 'planned' | 'done' | 'skipped' | 'backlog';

export interface Plan {
  id: number;
  createdAt: string;    // ISO datetime
  startDate: string;    // ISO date YYYY-MM-DD
  nbDays: number;
  reviewUnit: ReviewUnit;
  quantityPerDay: number;
  backlogStrategy: BacklogStrategy;
  active: boolean;
}

export interface Task {
  id: number;
  planId: number;
  scheduledDate: string; // YYYY-MM-DD
  unitType: ReviewUnit;
  unitId: number;
  label: string;
  status: TaskStatus;
  orderIndex: number;   // order within the day
}

// ─────────────────────────────────────────────
// History / completion events
// ─────────────────────────────────────────────

export interface CompletionEvent {
  id: number;
  taskId: number;
  completedAt: string;  // ISO datetime
  durationSeconds: number | null;
  note: string | null;
}

// ─────────────────────────────────────────────
// Statistics (derived, stored for perf)
// ─────────────────────────────────────────────

export interface DailyStats {
  date: string;         // YYYY-MM-DD
  plannedCount: number;
  doneCount: number;
  skippedCount: number;
}

export interface WeeklyStats {
  weekStart: string;    // YYYY-MM-DD (Monday)
  plannedCount: number;
  doneCount: number;
}

// ─────────────────────────────────────────────
// Download state
// ─────────────────────────────────────────────

export type DownloadStatus = 'idle' | 'downloading' | 'verifying' | 'done' | 'error';

export interface DownloadState {
  status: DownloadStatus;
  progress: number;     // 0-1
  errorMessage: string | null;
  lastAttempt: string | null;
  checksum: string | null;
}
