import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Reminder } from '../types/reminder';
import { formatDisplayDateTime } from '../utils/date';

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ReminderCard = ({ reminder, onComplete, onDelete }: ReminderCardProps) => {
  const completed = reminder.status === 'completed';

  return (
    <View style={[styles.card, completed && styles.completedCard]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, completed && styles.completedText]}>{reminder.title}</Text>
          <Text style={styles.time}>{formatDisplayDateTime(reminder.date, reminder.time, reminder.repeatType)}</Text>
        </View>
        <Text style={[styles.status, completed ? styles.doneStatus : styles.pendingStatus]}>
          {completed ? '已完成' : '待提醒'}
        </Text>
      </View>
      <Text style={[styles.content, completed && styles.completedText]}>{reminder.content}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={completed}
          onPress={() => onComplete(reminder.id)}
          style={[styles.actionButton, completed && styles.disabledButton]}
        >
          <Text style={styles.actionText}>标记完成</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onDelete(reminder.id)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Text style={[styles.actionText, styles.deleteText]}>删除</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 10,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 14,
  },
  completedCard: {
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  time: {
    color: '#64748b',
    fontSize: 12,
  },
  status: {
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  pendingStatus: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  doneStatus: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  content: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  completedText: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  disabledButton: {
    opacity: 0.45,
  },
  deleteButton: {
    backgroundColor: '#fff1f2',
  },
  actionText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteText: {
    color: '#e11d48',
  },
});
