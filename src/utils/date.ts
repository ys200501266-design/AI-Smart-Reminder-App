import { RepeatType } from '../types/reminder';

const pad = (value: number) => value.toString().padStart(2, '0');

export const formatDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const formatTimeInput = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const combineDateTime = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  if (!year || !month || !day || hour === undefined || minute === undefined) {
    return null;
  }

  const value = new Date(year, month - 1, day, hour, minute, 0, 0);
  return Number.isNaN(value.getTime()) ? null : value;
};

export const isValidFutureDateTime = (
  date: string,
  time: string,
  repeatType: RepeatType,
) => {
  const target = combineDateTime(date, time);
  if (!target) {
    return false;
  }

  return repeatType !== 'none' || target.getTime() > Date.now();
};

export const formatDisplayDateTime = (date: string, time: string, repeatType: RepeatType) => {
  const repeatText: Record<RepeatType, string> = {
    none: '不重复',
    daily: '每天',
    weekly: '每周',
  };

  return `${date} ${time} · ${repeatText[repeatType]}`;
};

export const getDefaultDateTime = () => {
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);
  return {
    date: formatDateInput(nextHour),
    time: formatTimeInput(nextHour),
  };
};
