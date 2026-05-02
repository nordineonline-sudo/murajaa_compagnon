// ─────────────────────────────────────────────
// Coran entities
// ─────────────────────────────────────────────

export interface Surah {
  id: number;           // 1-114
  nameArabic: string;
  nameTranslit: string;
  nameFr: string;
  verseCount: number;
  revelationType: 'meccan' | 'medinan';
  startPage: number;
}

export interface Ayah {
  id: number;           // global index 1-6236
  surahId: number;
  numberInSurah: number;
  arabic: string;
  transliteration: string;
  phoneticFr: string;   // "francisée" phonetic
  translationFr: string;
  pageId: number;
  juzId: number;
  hizbId: number;
}

/** One physical page of the Mushaf (1-604). */
export interface PageMushaf {
  id: number;           // 1-604
  juzId: number;
  hizbId: number;
  firstAyahId: number;
  lastAyahId: number;
  lineCount: number;    // typically 15
}

/** One line on a mushaf page. */
export interface Line {
  id: number;           // global line id
  pageId: number;
  lineIndex: number;    // 1-based within page
  ayahIds: number[];    // ayahs (or segments) visible on this line
  isBasmala: boolean;
}

export interface Juz {
  id: number;           // 1-30
  nameArabic: string;
  startPage: number;
  endPage: number;
  firstAyahId: number;
  lastAyahId: number;
}

export interface Hizb {
  id: number;           // 1-60  (2 hizb per juz)
  juzId: number;
  startPage: number;
  endPage: number;
  firstAyahId: number;
  lastAyahId: number;
}

// ─────────────────────────────────────────────
// User preferences
// ─────────────────────────────────────────────

export interface DisplaySettings {
  showArabic: boolean;
  showTransliteration: boolean;
  showPhonetic: boolean;
  showTranslation: boolean;
  arabicFontSize: number;   // default 24
  translationFontSize: number; // default 14
}

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
  display: DisplaySettings;
  planning: PlanningSettings;
  onboardingComplete: boolean;
  dataDownloaded: boolean;
  dataVersion: string;
}

// ─────────────────────────────────────────────
// Review selections
// ─────────────────────────────────────────────

export interface ReviewSelection {
  id: number;
  unitType: ReviewUnit;
  unitId: number;         // foreign key to Surah.id / PageMushaf.id / etc.
  label: string;
  selected: boolean;
  orderIndex: number;
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
