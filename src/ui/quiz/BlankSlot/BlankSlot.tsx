import type { ReactNode } from 'react';
import './BlankSlot.css';

export type BlankState = 'empty' | 'filled' | 'current';
export type BlankResult = 'none' | 'correct' | 'wrong';

/**
 * rc/Quiz/BlankSlot (proposed, RC · Proposed — issue #138): a blank inside a sentence — [first letter][answer or number]
 * on one underline. Variants: Mode readonly (a prompt / context line, other learners' cells) / button (the gap-match
 * slot, tapped to make it current or to clear it); State empty / filled / current; Result none / correct / wrong;
 * Prefix none / first-letter; Base none / word. Keeps the classes `context-blank` / `gap-slot` the tests select.
 * The article's .blank-chip (ArticlePane) shares the look.
 */
export function BlankSlot({
  mode = 'readonly',
  state = 'empty',
  result = 'none',
  label,
  text,
  prefix,
  base,
  ariaLabel,
  disabled,
  onClick,
}: {
  mode?: 'readonly' | 'button';
  state?: BlankState;
  result?: BlankResult;
  /** shown while empty: the blank's number (or a non-breaking space) */
  label?: ReactNode;
  /** State filled: the answer on the line */
  text?: ReactNode;
  prefix?: string;
  base?: string;
  ariaLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const filled = text !== undefined && text !== null;
  const cls = (base: string) =>
    [base, state === 'current' ? 'is-active' : '', mode === 'readonly' && filled ? 'is-filled' : '', result === 'none' ? '' : `is-${result}`]
      .filter(Boolean)
      .join(' ');
  if (mode === 'button') {
    return (
      <button className={cls('gap-slot')} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
        {filled ? <b className="blank-fill">{text}</b> : label}
      </button>
    );
  }
  return (
    <span className={cls('context-blank')}>
      {prefix && <span className="blank-prefix">{prefix}</span>}
      <span className={filled ? 'blank-fill' : 'blank-num'}>{filled ? text : label}</span>
      {base && <span className="blank-base">({base})</span>}
    </span>
  );
}
