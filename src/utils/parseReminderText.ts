import { ParsedReminder, RepeatType } from '../types/reminder';
import { formatDateInput, formatTimeInput } from './date';

const chineseNumberMap: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
};

const normalizeText = (text: string) => text.trim().replace(/\s+/g, '');

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseChineseHour = (raw: string) => {
  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  if (raw in chineseNumberMap) {
    return chineseNumberMap[raw];
  }

  if (raw.startsWith('十')) {
    return 10 + (chineseNumberMap[raw.slice(1)] ?? 0);
  }

  if (raw.includes('十')) {
    const [tens, ones] = raw.split('十');
    return (chineseNumberMap[tens || '一'] ?? 1) * 10 + (chineseNumberMap[ones || '零'] ?? 0);
  }

  return undefined;
};

const parseRepeatType = (text: string): RepeatType => {
  if (/每天|每日|天天/.test(text)) {
    return 'daily';
  }

  if (/每周|每星期|每礼拜/.test(text)) {
    return 'weekly';
  }

  return 'none';
};

const parseDate = (text: string, baseDate: Date) => {
  if (/后天/.test(text)) {
    return addDays(baseDate, 2);
  }

  if (/明天|明早|明晚/.test(text)) {
    return addDays(baseDate, 1);
  }

  return new Date(baseDate);
};

const parseTime = (text: string) => {
  const colonMatch = text.match(/([01]?\d|2[0-3])[:：]([0-5]\d)/);
  if (colonMatch) {
    return {
      hour: Number(colonMatch[1]),
      minute: Number(colonMatch[2]),
      matched: colonMatch[0],
    };
  }

  const timeMatch = text.match(
    /(凌晨|早上|上午|中午|下午|晚上|今晚|明早|明晚)?([零一二两三四五六七八九十\d]{1,3})点(半|[零一二两三四五六七八九十\d]{1,3}分?)?/,
  );

  if (!timeMatch) {
    return undefined;
  }

  const period = timeMatch[1] ?? '';
  const rawHour = timeMatch[2] ?? '';
  const rawMinute = timeMatch[3] ?? '';
  let hour = parseChineseHour(rawHour);

  if (hour === undefined) {
    return undefined;
  }

  if (/下午|晚上|今晚|明晚/.test(period) && hour < 12) {
    hour += 12;
  }

  if (/中午/.test(period) && hour < 11) {
    hour += 12;
  }

  let minute = 0;
  if (rawMinute === '半') {
    minute = 30;
  } else if (rawMinute) {
    const cleanedMinute = rawMinute.replace('分', '');
    minute = parseChineseHour(cleanedMinute) ?? 0;
  }

  return {
    hour: Math.min(hour, 23),
    minute: Math.min(minute, 59),
    matched: timeMatch[0],
  };
};

const extractContent = (text: string) => {
  const cleaned = text
    .replace(/(后天|明天|今天|今晚|明早|明晚|每天|每日|天天|每周|每星期|每礼拜)/g, '')
    .replace(/(凌晨|早上|上午|中午|下午|晚上)?[零一二两三四五六七八九十\d]{1,3}点(半|[零一二两三四五六七八九十\d]{1,3}分?)?/g, '')
    .replace(/([01]?\d|2[0-3])[:：]([0-5]\d)/g, '')
    .replace(/提醒我|提醒一下我|叫我|让我|记得|去/g, '')
    .replace(/提醒|一下/g, '')
    .trim();

  return cleaned || text;
};

/**
 * Lightweight local parser for portfolio MVP demos.
 * It handles common Chinese date/time phrases before a future LLM parser is added.
 */
export const parseReminderText = (input: string, baseDate = new Date()): ParsedReminder => {
  const text = normalizeText(input);
  const repeatType = parseRepeatType(text);
  const parsedTime = parseTime(text);
  const parsedDate = parseDate(text, baseDate);

  if (parsedTime) {
    parsedDate.setHours(parsedTime.hour, parsedTime.minute, 0, 0);
  }

  if (parsedTime && repeatType === 'none' && parsedDate.getTime() <= baseDate.getTime()) {
    parsedDate.setDate(parsedDate.getDate() + 1);
  }

  if (parsedTime && repeatType !== 'none' && parsedDate.getTime() <= baseDate.getTime()) {
    parsedDate.setDate(parsedDate.getDate() + 1);
  }

  const content = extractContent(text);
  const confidence = [Boolean(text), Boolean(parsedTime), content !== text].filter(Boolean).length / 3;

  return {
    reminder_title: content.length > 12 ? `${content.slice(0, 12)}...` : content || '新的提醒',
    reminder_content: content || input,
    date: formatDateInput(parsedDate),
    time: parsedTime ? formatTimeInput(parsedDate) : formatTimeInput(baseDate),
    repeat_type: repeatType,
    confidence,
    needsConfirmation: !parsedTime || confidence < 0.67,
  };
};
