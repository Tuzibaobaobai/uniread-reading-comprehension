import { t as i18nT, type TFunction } from '@/i18n';

export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
export type Paper = 'reading_writing' | 'reading' | 'writing' | 'listening' | 'speaking';

/** English names printed on the item thumbnails (cover artwork: the same in every UI language) */
export const DAY_NAME = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' } as const;
export const PAPER_EN = { reading_writing: 'Reading & Writing', reading: 'Reading', writing: 'Writing', listening: 'Listening', speaking: 'Speaking' } as const;

/** UI names (i18n `day.*`, `paper.*`) */
export const dayLabel = (d: Day, t: TFunction = i18nT) => t(`day.${d}`);
export const paperLabel = (p: Paper, t: TFunction = i18nT) => t(`paper.${p}`);

export function formatMinutes(min: number, t: TFunction = i18nT) {
  return t('common.minutes', { count: min });
}

export function formatDuration(sec: number, t: TFunction = i18nT) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? t('common.durationMinSec', { m, s }) : t('common.durationSec', { s });
}
