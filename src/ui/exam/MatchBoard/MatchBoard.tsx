import type { ReactNode } from 'react';
import { LetterBadge } from '../../LetterBadge/LetterBadge';
import './MatchBoard.css';

export type BoardResult = 'none' | 'correct' | 'wrong';

/**
 * rc/Exam/MatchBoard (proposed, RC · Proposed — issue #138, screen 2.10): KET Listening Part 5 — the people (the
 * questions) in one column, all options in the other, each option used once; the printed column headings stay above
 * their own column when the board stacks (container < 640px). MatchBoardPerson / MatchBoardOption are its rows; their
 * letters are ui/LetterBadge (answer badge: Filled no / yes, Tone accent; option letter: Tone accent). Keeps the classes
 * `match-board`, `match-board-person` (+ is-example / is-active / is-correct / is-wrong), `match-board-badge`,
 * `match-board-option` (+ is-example / is-used / is-here), `match-board-letter` that the tests select.
 */
export function MatchBoard({
  columns,
  peopleLabel,
  optionsLabel,
  people,
  options,
}: {
  /** the printed column headings */
  columns?: { left: ReactNode; right: ReactNode };
  peopleLabel: string;
  optionsLabel: string;
  /** MatchBoardPerson rows */
  people: ReactNode;
  /** MatchBoardOption rows */
  options: ReactNode;
}) {
  return (
    <div className="match-board">
      {columns && (
        <>
          <p className="match-board-head">{columns.left}</p>
          <p className="match-board-head">{columns.right}</p>
        </>
      )}
      <ol className="match-board-people" aria-label={peopleLabel}>
        {people}
      </ol>
      <div className="match-board-options" role="group" aria-label={optionsLabel}>
        {options}
      </div>
    </div>
  );
}

/**
 * a person (question): number, text and the answer badge; Example (the printed example: not a button, badge filled);
 * Active (the person the next option goes to); Result none / correct / wrong (wrong shows the right answer).
 */
export function MatchBoardPerson({
  number,
  answer,
  example = false,
  active = false,
  result = 'none',
  rightAnswer,
  disabled,
  ariaLabel,
  onClick,
  children,
}: {
  number: number | string;
  /** the letter given to this person (empty badge while unanswered) */
  answer?: string;
  example?: boolean;
  active?: boolean;
  result?: BoardResult;
  /** Result wrong: the right letter(s) */
  rightAnswer?: string;
  disabled?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const body = (
    <>
      <span className="q-num">{number}</span>
      <span className="match-board-text">{children}</span>
      <LetterBadge className="match-board-badge" filled={example || !!answer} tone="accent">
        {answer ?? ''}
      </LetterBadge>
      {result === 'wrong' && rightAnswer !== undefined && <span className="match-board-answer">→ {rightAnswer}</span>}
    </>
  );
  if (example)
    return (
      <li className="match-board-person is-example" aria-label={ariaLabel}>
        {body}
      </li>
    );
  return (
    <li>
      <button
        className={['match-board-person', active ? 'is-active' : '', result === 'none' ? '' : `is-${result}`].filter(Boolean).join(' ')}
        disabled={disabled}
        aria-pressed={active}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {body}
      </button>
    </li>
  );
}

/**
 * an option: letter, text and who has it. Example (taken by the printed example: struck through, disabled); Used (given
 * to someone — `mark` shows their number); Here (given to the active person).
 */
export function MatchBoardOption({
  letter,
  example = false,
  used = false,
  here = false,
  mark,
  disabled,
  ariaLabel,
  onClick,
  children,
}: {
  letter: string;
  example?: boolean;
  used?: boolean;
  here?: boolean;
  /** the right-hand mark: the owner's number, or the example label */
  mark?: ReactNode;
  disabled?: boolean;
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={['match-board-option', example ? 'is-example' : '', used ? 'is-used' : '', here ? 'is-here' : ''].filter(Boolean).join(' ')}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <LetterBadge className="match-board-letter" tone="accent" bare>
        {letter}
      </LetterBadge>
      <span className="match-board-text">{children}</span>
      {mark !== undefined && mark !== null && mark !== false && <span className="match-board-used">{mark}</span>}
    </button>
  );
}
