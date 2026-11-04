import type { CSSProperties, ReactNode } from 'react';
import './LetterBadge.css';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger';

/**
 * ui/LetterBadge — extends UniRead Learn `num` (18140:222459): the letter square of a word bank entry and of a match
 * pair, the exam option letters (.part-grid-letter, .match-board-letter) and the match-board answer badge
 * (.match-board-badge). Variants: Filled no / yes; Tone neutral / accent / success / danger (unfilled accent colours the
 * letter); Size s / m; Bare — the plain accent letter with no box (exam grid and board option letters). A match pair's own colour
 * (color/pair/1–7) comes in through `color` and fills the badge. `className` keeps the legacy hooks (.bank-letter,
 * .match-badge) the tests select.
 */
export function LetterBadge({
  filled = false,
  tone = 'neutral',
  size = 'm',
  bare = false,
  color,
  className = '',
  children,
}: {
  filled?: boolean;
  tone?: BadgeTone;
  size?: 's' | 'm';
  /** no box: the letter alone in the tone colour */
  bare?: boolean;
  /** a pair colour token, e.g. var(--ur-color-pair-2); implies Filled */
  color?: string;
  className?: string;
  children?: ReactNode;
}) {
  const style: CSSProperties | undefined = color ? { background: color } : undefined;
  return (
    <span
      className={['letter-badge', `is-${size}`, filled || color ? 'is-filled' : '', bare ? 'is-bare' : '', `is-${tone}`, className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </span>
  );
}
