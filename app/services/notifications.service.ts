import { LocalNotifications } from '@nativescript/local-notifications';

export class NotificationsService {
  async scheduleReminders(): Promise<void> {
    const reminders = [
      { id: 1, hour: 9, minute: 0 },
      { id: 2, hour: 14, minute: 0 },
      { id: 3, hour: 20, minute: 0 }
    ];

    await LocalNotifications.requestPermission();

    for (const reminder of reminders) {
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        reminder.hour,
        reminder.minute
      );

      if (scheduledTime.getTime() < now.getTime()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule([{
        id: reminder.id,
        title: 'Energy Level Check',
        body: 'Time to log your current energy level!',
        scheduled: true,
        at: scheduledTime,
        interval: 'day'
      }]);
    }
  }
}

export const notifications = new NotificationsService();