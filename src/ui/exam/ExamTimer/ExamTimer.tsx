import type { ReactNode } from 'react';
import './ExamTimer.css';

export type TimerLevel = 'normal' | 'warning' | 'alert';

/**
 * RC/Exam/ExamTimer (proposed, issue #138): the exam countdown text inside rc/Exam/ModeSelect (剩余 N 分钟 → m:ss).
 * Variant Level normal / warning (≤ 5 minutes) / alert (≤ 1 minute). Presentational: the caller ticks the clock and
 * passes the text; `live` turns on polite announcements. Keeps .exam-timer / .is-warn / .is-alert and role timer.
 */
export function ExamTimer({ level = 'normal', live = false, ariaLabel, children }: { level?: TimerLevel; live?: boolean; ariaLabel?: string; children: ReactNode }) {
  const cls = level === 'alert' ? 'is-alert' : level === 'warning' ? 'is-warn' : '';
  return (
    <span className={['exam-timer', cls].filter(Boolean).join(' ')} role="timer" aria-live={live ? 'polite' : 'off'} aria-label={ariaLabel}>
      {children}
    </span>
  );
}
