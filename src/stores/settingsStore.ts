import { create } from 'zustand';
import type { UserSettings, PlanningSettings } from '@/types';
import { getDatabase } from '@/db/database';

const DEFAULT_SETTINGS: UserSettings = {
  planning: {
    reviewUnit: 'page',
    quantityPerDay: 1,
    planDurationDays: 30,
    startDate: new Date().toISOString().substring(0, 10),
    notificationHours: [7, 20],
    backlogStrategy: 'postpone',
  },
  onboardingComplete: false,
};

interface SettingsState {
  settings: UserSettings;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updatePlanning: (update: Partial<PlanningSettings>) => Promise<void>;
  setOnboardingComplete: (value: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM user_settings'
    );
    const map: Record<string, string> = {};
    rows.forEach(r => { map[r.key] = r.value; });

    const settings: UserSettings = {
      planning: map['planning'] ? JSON.parse(map['planning']) : DEFAULT_SETTINGS.planning,
      onboardingComplete: map['onboardingComplete'] === 'true',
    };
    set({ settings, loaded: true });
  },

  updatePlanning: async (update) => {
    const current = get().settings;
    const planning = { ...current.planning, ...update };
    await persistKey('planning', planning);
    set({ settings: { ...current, planning } });
  },

  setOnboardingComplete: async (value) => {
    const current = get().settings;
    await persistKey('onboardingComplete', value);
    set({ settings: { ...current, onboardingComplete: value } });
  },
}));

async function persistKey(key: string, value: unknown): Promise<void> {
  const db = await getDatabase();
  // Booleans are stored as 'true'/'false' strings for consistent equality checks on read.
  // Objects/arrays are JSON-stringified. Primitives are coerced to string.
  let serialized: string;
  if (typeof value === 'boolean') {
    serialized = value ? 'true' : 'false';
  } else if (typeof value === 'string') {
    serialized = value;
  } else {
    serialized = JSON.stringify(value);
  }
  await db.runAsync(
    'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
    [key, serialized]
  );
}
