import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { StreakItem } from './storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule daily notification for a streak
 */
export async function scheduleStreakNotification(streak: StreakItem): Promise<string | null> {
  if (!streak.notificationEnabled || !streak.notificationTime) {
    return null;
  }

  try {
    // Cancel existing notification for this streak
    await cancelStreakNotification(streak.id);

    // Validate and parse time
    const timeParts = streak.notificationTime.split(':');
    if (timeParts.length !== 2) {
      console.error('Invalid time format:', streak.notificationTime);
      return null;
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error('Invalid time values:', hours, minutes);
      return null;
    }
    
    // Create a date for today with the specified time
    const triggerDate = new Date();
    triggerDate.setHours(hours);
    triggerDate.setMinutes(minutes);
    triggerDate.setSeconds(0);
    
    // If the time has already passed today, schedule for tomorrow
    if (triggerDate.getTime() < Date.now()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 ${streak.name}`,
        body: `Don't forget to complete your ${streak.streak} day streak today!`,
        sound: true,
        data: { streakId: streak.id },
      },
      trigger: {
        type: 'calendar',
        hour: hours,
        minute: minutes,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel notification for a streak
 */
export async function cancelStreakNotification(streakId: string): Promise<void> {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const notificationsToCancel = allNotifications.filter(
      (notification) => notification.content.data?.streakId === streakId
    );

    for (const notification of notificationsToCancel) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all notifications for all streaks
 */
export async function cancelAllStreakNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Schedule notifications for all enabled streaks
 */
export async function scheduleAllStreakNotifications(streaks: StreakItem[]): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.warn('Notification permissions not granted');
    return;
  }

  for (const streak of streaks) {
    if (streak.notificationEnabled && streak.notificationTime) {
      await scheduleStreakNotification(streak);
    }
  }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}
