import type { ReactNode } from 'react';
import './MatchRow.css';

export type MatchRowResult = 'none' | 'correct' | 'wrong';
export type MatchLetterState = 'off' | 'on' | 'used';

/**
 * rc/Exam/MatchRow (proposed, RC · Proposed — issue #138, screen 2.22): PET Reading Part 2 — a card per person (photo,
 * number and what they want) with a row of letter toggles; each letter is used once. Variants: Result none / correct /
 * wrong (the card); MatchRowLetter: Letter off / on / used (given to another question, whose number sits on the corner)
 * + Result none / correct / wrong — a 44px round toggle, unlike the static ui/LetterBadge. MatchRows is the list.
 * Keeps the classes `match-rows`, `match-row` (+ has-photo / is-correct / is-wrong), `match-row-photo`,
 * `match-row-text`, `match-row-letters`, `match-row-letter` (+ is-on / is-used / is-correct / is-wrong) the tests select.
 */
export function MatchRows({ children }: { children: ReactNode }) {
  return <ol className="match-rows">{children}</ol>;
}

export function MatchRow({
  number,
  photo,
  result = 'none',
  lettersLabel,
  letters,
  children,
}: {
  number: number | string;
  /** the person's printed photo: a visual anchor while checking back against the texts (#91) */
  photo?: { src: string; alt: string; width?: number; height?: number };
  result?: MatchRowResult;
  /** the radiogroup's label */
  lettersLabel: string;
  /** MatchRowLetter toggles */
  letters: ReactNode;
  /** the person's description */
  children: ReactNode;
}) {
  return (
    <li className={['match-row', photo ? 'has-photo' : '', result === 'none' ? '' : `is-${result}`].filter(Boolean).join(' ')}>
      {photo && <img className="match-row-photo" src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />}
      <p className="match-row-text">
        <span className="q-num">{number}.</span> {children}
      </p>
      <div className="match-row-letters" role="radiogroup" aria-label={lettersLabel}>
        {letters}
      </div>
    </li>
  );
}

export function MatchRowLetter({
  letter,
  state = 'off',
  result = 'none',
  owner,
  ariaLabel,
  disabled,
  onClick,
}: {
  letter: string;
  state?: MatchLetterState;
  result?: MatchRowResult;
  /** Letter used: the number of the question that has it */
  owner?: number | string;
  ariaLabel: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const cls = ['match-row-letter', state === 'off' ? '' : `is-${state}`, result === 'none' ? '' : `is-${result}`].filter(Boolean).join(' ');
  return (
    <button role="radio" aria-checked={state === 'on'} aria-label={ariaLabel} className={cls} disabled={disabled} onClick={onClick}>
      {letter}
      {state === 'used' && owner !== undefined && <span className="match-row-owner">{owner}</span>}
    </button>
  );
}
