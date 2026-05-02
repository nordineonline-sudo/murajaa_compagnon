import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule daily reminders at the given hours.
 * Cancels all existing reminders before re-scheduling.
 */
export async function scheduleDailyReminders(hours: number[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const hour of hours) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Murajaa Compagnon 📖',
        body: 'Vos tâches de révision du jour vous attendent !',
        sound: undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledReminders(): Promise<
  Notifications.NotificationRequest[]
> {
  return Notifications.getAllScheduledNotificationsAsync();
}
