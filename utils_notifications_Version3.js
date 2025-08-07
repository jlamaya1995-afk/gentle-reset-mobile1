import * as Notifications from 'expo-notifications';

export async function scheduleWorkoutNotification(hour, minute, message) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Gentle Reset",
      body: message,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}