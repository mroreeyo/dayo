import * as Notifications from 'expo-notifications';
import type { EventDto } from '../api/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const ALL_DAY_REMINDER_HOUR = 9;

export async function scheduleEventReminder(event: EventDto): Promise<void> {
  if (!event.remindMinutes || event.remindMinutes <= 0) return;

  const startTime = event.allDay
    ? new Date(event.startDate + 'T' + String(ALL_DAY_REMINDER_HOUR).padStart(2, '0') + ':00:00')
    : new Date(event.startAtUtc!);

  const fireAt = new Date(startTime.getTime() - event.remindMinutes * 60_000);

  if (fireAt <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '일정 알림',
      body: event.title,
      data: { eventId: event.id, calendarId: event.calendarId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
    identifier: `event-reminder:${event.id}`,
  });
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`event-reminder:${eventId}`);
}

export async function rescheduleEventReminder(event: EventDto): Promise<void> {
  await cancelEventReminder(event.id);
  await scheduleEventReminder(event);
}
