export type RepeatType = 'none' | 'daily' | 'weekly';

export type AlertType = 'notification' | 'vibration' | 'both';

export type ReminderStatus = 'pending' | 'completed';

export interface Reminder {
  id: string;
  title: string;
  content: string;
  date: string;
  time: string;
  repeatType: RepeatType;
  alertType: AlertType;
  status: ReminderStatus;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedReminder {
  reminder_title: string;
  reminder_content: string;
  date: string;
  time: string;
  repeat_type: RepeatType;
  confidence: number;
  needsConfirmation: boolean;
}
