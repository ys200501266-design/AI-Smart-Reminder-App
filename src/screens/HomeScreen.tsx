import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { InputField } from '../components/InputField';
import { ReminderCard } from '../components/ReminderCard';
import { SegmentControl } from '../components/SegmentControl';
import { reminderStorage } from '../services/storage';
import {
  cancelReminderNotification,
  registerForegroundVibration,
  scheduleReminderNotification,
  scheduleTenSecondTestNotification,
} from '../services/notification';
import { AlertType, Reminder, RepeatType } from '../types/reminder';
import { getDefaultDateTime, isValidFutureDateTime } from '../utils/date';
import { parseReminderText } from '../utils/parseReminderText';

const repeatOptions = [
  { label: '不重复', value: 'none' },
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
] satisfies Array<{ label: string; value: RepeatType }>;

const alertOptions = [
  { label: '通知', value: 'notification' },
  { label: '震动', value: 'vibration' },
  { label: '通知+震动', value: 'both' },
] satisfies Array<{ label: string; value: AlertType }>;

const createInitialForm = () => {
  const defaults = getDefaultDateTime();
  return {
    title: '',
    content: '',
    date: defaults.date,
    time: defaults.time,
    repeatType: 'none' as RepeatType,
    alertType: 'both' as AlertType,
  };
};

export const HomeScreen = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [form, setForm] = useState(createInitialForm);
  const [naturalText, setNaturalText] = useState('');
  const [parseHint, setParseHint] = useState('');
  const [loading, setLoading] = useState(false);

  const pendingCount = useMemo(
    () => reminders.filter((item) => item.status === 'pending').length,
    [reminders],
  );

  useEffect(() => {
    reminderStorage.getAll().then(setReminders);
    const receivedSubscription = registerForegroundVibration();
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
      reminderStorage.getAll().then(setReminders);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleParseNaturalText = () => {
    if (!naturalText.trim()) {
      Alert.alert('请输入一句提醒', '例如：明天早上九点提醒我交作业');
      return;
    }

    const parsed = parseReminderText(naturalText);
    setForm({
      title: parsed.reminder_title,
      content: parsed.reminder_content,
      date: parsed.date,
      time: parsed.time,
      repeatType: parsed.repeat_type,
      alertType: form.alertType,
    });

    setParseHint(
      parsed.needsConfirmation
        ? '已尽量解析，请手动确认日期和时间。'
        : `解析成功，置信度 ${Math.round(parsed.confidence * 100)}%。`,
    );
  };

  const handleAddReminder = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('信息不完整', '请填写提醒标题和提醒内容。');
      return;
    }

    if (!isValidFutureDateTime(form.date, form.time, form.repeatType)) {
      Alert.alert('时间不正确', '不重复提醒需要选择一个未来时间，日期格式为 YYYY-MM-DD，时间格式为 HH:mm。');
      return;
    }

    setLoading(true);
    const now = new Date().toISOString();
    const reminder: Reminder = {
      id: `${Date.now()}`,
      title: form.title.trim(),
      content: form.content.trim(),
      date: form.date,
      time: form.time,
      repeatType: form.repeatType,
      alertType: form.alertType,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    try {
      const notificationId = await scheduleReminderNotification(reminder);
      const next = await reminderStorage.add({
        ...reminder,
        notificationId,
      });
      setReminders(next);
      setForm(createInitialForm());
      setNaturalText('');
      setParseHint('');
      Alert.alert('提醒已创建', '到达时间后会通过本地通知提醒你。');
    } catch (error) {
      Alert.alert('创建失败', error instanceof Error ? error.message : '请检查通知权限后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    const target = reminders.find((item) => item.id === id);
    await cancelReminderNotification(target?.notificationId);
    const next = await reminderStorage.update(id, { status: 'completed' });
    setReminders(next);
  };

  const handleDelete = async (id: string) => {
    const target = reminders.find((item) => item.id === id);
    await cancelReminderNotification(target?.notificationId);
    const next = await reminderStorage.remove(id);
    setReminders(next);
  };

  const handleTenSecondTest = async () => {
    try {
      await scheduleTenSecondTestNotification();
      Alert.alert('测试提醒已安排', '请保持 App 在前台或切到后台，10 秒后查看通知。');
    } catch (error) {
      Alert.alert('测试失败', error instanceof Error ? error.message : '请检查通知权限。');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>AI Smart Reminder App</Text>
          <Text style={styles.title}>AI 智能提醒助手</Text>
          <Text style={styles.subtitle}>用一句话创建提醒，也可以手动设置通知、震动和重复周期。</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{reminders.length}</Text>
              <Text style={styles.statLabel}>全部提醒</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pendingCount}</Text>
              <Text style={styles.statLabel}>待提醒</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>智能输入</Text>
            <Pressable accessibilityRole="button" onPress={handleTenSecondTest} style={styles.testButton}>
              <Text style={styles.testButtonText}>10 秒测试提醒</Text>
            </Pressable>
          </View>
          <InputField
            label="自然语言提醒"
            multiline
            onChangeText={setNaturalText}
            placeholder="例如：每天下午三点提醒我喝水"
            style={styles.naturalInput}
            value={naturalText}
          />
          {parseHint ? <Text style={styles.parseHint}>{parseHint}</Text> : null}
          <Pressable accessibilityRole="button" onPress={handleParseNaturalText} style={styles.primaryGhostButton}>
            <Text style={styles.primaryGhostText}>解析并填入表单</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>新增提醒</Text>
          <InputField label="提醒标题" onChangeText={(value) => updateForm('title', value)} placeholder="例如：交作业" value={form.title} />
          <InputField
            label="提醒内容"
            multiline
            onChangeText={(value) => updateForm('content', value)}
            placeholder="例如：记得提交英语作业"
            style={styles.contentInput}
            value={form.content}
          />
          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <InputField label="提醒日期" onChangeText={(value) => updateForm('date', value)} placeholder="YYYY-MM-DD" value={form.date} />
            </View>
            <View style={styles.inlineField}>
              <InputField label="提醒时间" onChangeText={(value) => updateForm('time', value)} placeholder="HH:mm" value={form.time} />
            </View>
          </View>
          <SegmentControl label="是否重复" onChange={(value) => updateForm('repeatType', value)} options={repeatOptions} value={form.repeatType} />
          <SegmentControl label="提醒方式" onChange={(value) => updateForm('alertType', value)} options={alertOptions} value={form.alertType} />
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={handleAddReminder}
            style={[styles.primaryButton, loading && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>{loading ? '创建中...' : '创建提醒'}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提醒列表</Text>
          {reminders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>还没有提醒</Text>
              <Text style={styles.emptyText}>先试试输入“明天早上九点提醒我交作业”。</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {reminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  reminder={reminder}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 18,
    paddingBottom: 36,
  },
  hero: {
    gap: 10,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  eyebrow: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  statBox: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    padding: 12,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  naturalInput: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  contentInput: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  parseHint: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryGhostButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  primaryGhostText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
  testButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f97316',
    paddingHorizontal: 12,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineField: {
    flex: 1,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 22,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
});
