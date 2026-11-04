import type { ReactNode } from 'react';
import { LetterBadge } from '../../LetterBadge/LetterBadge';
import './MatchItem.css';

export type MatchResult = 'none' | 'correct' | 'wrong';

/**
 * rc/Quiz/MatchItem (proposed, RC · Proposed — issue #138): one item of a 连线 match. Variants: Side prompt (left:
 * id, text, pair badge, the right answer when wrong) / option (right: pair badge, id, text); State default / (hover) /
 * active (the prompt being paired) / target (options while a prompt is active); Pair none / 1–7 (color/pair/n on the
 * border and the ui/LetterBadge); Result none / correct / wrong. Keeps the classes `match-item` / `match-badge` the
 * tests select. MatchColumns lays the two sides out (`.match` / `.match-col`).
 */
export function MatchItem({
  side,
  id,
  active = false,
  target = false,
  pair,
  result = 'none',
  answer,
  disabled,
  onClick,
  children,
}: {
  side: 'prompt' | 'option';
  id: string;
  active?: boolean;
  target?: boolean;
  /** Pair: the paired item's id shown in the badge and the pair's colour token */
  pair?: { label: string; color: string };
  result?: MatchResult;
  /** Result wrong (prompt side): the right option's id */
  answer?: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const badge = (
    <LetterBadge className="match-badge" color={pair?.color}>
      {pair?.label ?? ''}
    </LetterBadge>
  );
  return (
    <button
      className={`match-item ${active ? 'is-active' : ''} ${target ? 'is-target' : ''} ${result === 'none' ? '' : `is-${result}`}`}
      style={pair ? { borderColor: pair.color } : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {side === 'option' && badge}
      <span className="match-id">{id}</span>
      <span className="match-text">{children}</span>
      {side === 'prompt' && badge}
      {answer && <span className="match-answer">→ {answer}</span>}
    </button>
  );
}

export function MatchColumns({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="match">
      <div className="match-col">{left}</div>
      <div className="match-col">{right}</div>
    </div>
  );
}
