import type { HTMLAttributes, ReactNode } from 'react';
import './InlineNotice.css';

export type NoticeTone = 'danger' | 'warning' | 'info';

/**
 * RC/Common/InlineNotice (proposed): an inline message — 判分服务不可用, 上次考试时间已到, 切换任务确认, 录音出错,
 * 加载失败. Variants: Tone danger / warning / info; Actions slot (chips) after the text.
 */
export function InlineNotice({ tone = 'danger', actions, className = '', children, ...rest }: { tone?: NoticeTone; actions?: ReactNode; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['inline-notice', `is-${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className="inline-notice-text">{children}</span>
      {actions}
    </div>
  );
}
