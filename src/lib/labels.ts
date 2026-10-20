export const DAY_NAME = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' } as const;
export const DAY_ZH = { mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五' } as const;
export const PAPER_ZH = { reading_writing: '阅读与写作', listening: '听力', speaking: '口语' } as const;
export const PAPER_EN = { reading_writing: 'Reading & Writing', listening: 'Listening', speaking: 'Speaking' } as const;

export function formatMinutes(min: number) {
  return `${min} min`;
}

export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}min ${s}s` : `${s}s`;
}
