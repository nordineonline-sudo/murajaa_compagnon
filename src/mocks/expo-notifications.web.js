// Mock web pour expo-notifications
// Les notifications natives ne sont pas disponibles sur web.

const SchedulableTriggerInputTypes = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  DATE: 'date',
  INTERVAL: 'interval',
};

module.exports = {
  SchedulableTriggerInputTypes,

  setNotificationHandler: (_handler) => {},

  getPermissionsAsync: async () => ({ status: 'denied' }),
  requestPermissionsAsync: async () => ({ status: 'denied' }),

  scheduleNotificationAsync: async (_request) => 'mock-id',
  cancelAllScheduledNotificationsAsync: async () => {},
  getAllScheduledNotificationsAsync: async () => [],

  addNotificationReceivedListener: (_listener) => ({ remove: () => {} }),
  addNotificationResponseReceivedListener: (_listener) => ({ remove: () => {} }),
  removeNotificationSubscription: (_subscription) => {},
};
