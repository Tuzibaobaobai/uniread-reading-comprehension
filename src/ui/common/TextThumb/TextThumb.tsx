import type { CSSProperties } from 'react';
import './TextThumb.css';

export type TextThumbKind = 'reading' | 'exam';

/**
 * RC/Common/TextThumb (proposed, #138; #108): the text cover of a playlist item — kicker (Week 1 · Monday / Test 1 ·
 * Reading / Day 1) + title on the playlist accent. Variants: Kind reading / exam (same look; exam = a test paper).
 * Keeps the classes `.text-thumb*` (e2e: `.item-row-thumb.text-thumb`).
 */
export function TextThumb({
  title,
  kicker,
  accent,
  kind = 'reading',
  className,
}: {
  title: string;
  /** small line above the title, e.g. "Week 1 · Monday" or "Test 1 · Listening" */
  kicker: string;
  /** the playlist accent colour (content data) */
  accent: string;
  kind?: TextThumbKind;
  className?: string;
}) {
  return (
    <div className={`${className ?? ''} text-thumb is-${kind}`} style={{ '--thumb-accent': accent } as CSSProperties} aria-hidden>
      <span className="text-thumb-day">{kicker}</span>
      <span className="text-thumb-title">{title}</span>
    </div>
  );
}
