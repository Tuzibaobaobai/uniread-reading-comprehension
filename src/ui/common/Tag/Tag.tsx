import type { HTMLAttributes, ReactNode } from 'react';
import './Tag.css';

export type TagTone = 'neutral' | 'accent' | 'solid' | 'outline';

/**
 * RC/Common/Tag (proposed): the pill label — 模型评分 / 待复核, 未选择, 考官 / 搭档, 正在播放, a test's score.
 * Variants: Tone neutral (grey) / accent (brand soft) / solid (brand fill) / outline (card + border).
 * `className` keeps the legacy hooks (.judge-tag, .speak-role, .test-score …) that tests and callers use.
 */
export function Tag({ tone = 'neutral', className = '', children, ...rest }: { tone?: TagTone; children: ReactNode } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={['ur-tag', `is-${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}
