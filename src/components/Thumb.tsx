import type { CSSProperties } from 'react';

/**
 * item cover in a playlist: one card style for every resource — kicker (Week-Day / Test-paper) + title in the
 * playlist accent (#108; the book's article pictures are no longer used as covers)
 */
export function Thumb({
  title,
  kicker,
  accent,
  className,
}: {
  title: string;
  /** small line above the title, e.g. "Week 1 · Monday" or "Test 1 · Listening" */
  kicker: string;
  accent: string;
  className?: string;
}) {
  return (
    <div className={`${className ?? ''} text-thumb`} style={{ '--thumb-accent': accent } as CSSProperties} aria-hidden>
      <span className="text-thumb-day">{kicker}</span>
      <span className="text-thumb-title">{title}</span>
    </div>
  );
}
