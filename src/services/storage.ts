import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder } from '../types/reminder';

const REMINDERS_KEY = '@ai-smart-reminder/reminders';

export const reminderStorage = {
  async getAll(): Promise<Reminder[]> {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as Reminder[];
    } catch {
      return [];
    }
  },

  async saveAll(reminders: Reminder[]) {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  },

  async add(reminder: Reminder) {
    const reminders = await this.getAll();
    const next = [reminder, ...reminders];
    await this.saveAll(next);
    return next;
  },

  async update(id: string, patch: Partial<Reminder>) {
    const reminders = await this.getAll();
    const next = reminders.map((item) =>
      item.id === id
        ? {
            ...item,
            ...patch,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    await this.saveAll(next);
    return next;
  },

  async remove(id: string) {
    const reminders = await this.getAll();
    const next = reminders.filter((item) => item.id !== id);
    await this.saveAll(next);
    return next;
  },
};
