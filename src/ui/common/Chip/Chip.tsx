import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Chip.css';

export type ChipTone = 'neutral' | 'on' | 'correct' | 'wrong' | 'flag';

/**
 * RC/Common/Chip (proposed): the small pill button — 定位原文, 清空, 对 / 不对 self-assessment, 标记本题 (Tone flag), 成绩报告,
 * 取消 / 切换. Variants: Tone neutral / on / correct / wrong / flag (标记本题 when flagged: warning border + icon); Icon slot.
 * Keeps the class name `chip` (and the caller's extra classes) that the e2e tests select.
 */
export function Chip({ tone = 'neutral', icon, className = '', children, ...rest }: { tone?: ChipTone; icon?: ReactNode; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const toneClass = tone === 'neutral' ? '' : `is-${tone}`;
  return (
    <button type="button" className={['chip', toneClass, className].filter(Boolean).join(' ')} {...rest}>
      {icon}
      {children}
    </button>
  );
}
