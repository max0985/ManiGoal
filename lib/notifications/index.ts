import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    return true;
  } catch (error) {
    console.error('Error registering for notifications:', error);
    return false;
  }
}

export async function scheduleDailyQuoteNotification(hour: number = 9, minute: number = 0) {
  try {
    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule new daily notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Your Daily Inspiration",
        body: "Start your day with a motivational quote! 🌟",
        data: { screen: 'quotes' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return false;
  }
}

export async function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data;
  
  if (data?.screen === 'quotes') {
    // Navigate to quotes screen
    // This will be handled by the navigation system
  }
} 