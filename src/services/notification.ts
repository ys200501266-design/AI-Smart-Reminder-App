import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Reminder } from '../types/reminder';
import { combineDateTime } from '../utils/date';

const CHANNEL_ID = 'smart-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'AI 智能提醒',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 350, 180, 350],
      lightColor: '#2563eb',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
};

const createTrigger = (reminder: Reminder) => {
  const target = combineDateTime(reminder.date, reminder.time);
  if (!target) {
    throw new Error('提醒时间格式不正确');
  }

  if (reminder.repeatType === 'daily') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: target.getHours(),
      minute: target.getMinutes(),
      channelId: CHANNEL_ID,
    };
  }

  if (reminder.repeatType === 'weekly') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: target.getDay() + 1,
      hour: target.getHours(),
      minute: target.getMinutes(),
      channelId: CHANNEL_ID,
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: target,
    channelId: CHANNEL_ID,
  };
};

export const scheduleReminderNotification = async (reminder: Reminder) => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    throw new Error('没有通知权限，请在系统设置中开启通知权限');
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.content,
      sound: true,
      data: {
        reminderId: reminder.id,
        alertType: reminder.alertType,
      },
    },
    trigger: createTrigger(reminder),
  });

  return notificationId;
};

export const scheduleTenSecondTestNotification = async () => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    throw new Error('没有通知权限，请先允许 App 发送通知');
  }

  Vibration.vibrate([0, 250, 120, 250]);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: '10 秒测试提醒',
      body: '如果你看到这条通知，说明本地提醒功能可用。',
      sound: true,
      data: {
        alertType: 'both',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      channelId: CHANNEL_ID,
    },
  });
};

export const cancelReminderNotification = async (notificationId?: string) => {
  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

export const registerForegroundVibration = () =>
  Notifications.addNotificationReceivedListener((notification) => {
    const alertType = notification.request.content.data?.alertType;
    if (alertType === 'vibration' || alertType === 'both') {
      Vibration.vibrate([0, 350, 180, 350]);
    }
  });
