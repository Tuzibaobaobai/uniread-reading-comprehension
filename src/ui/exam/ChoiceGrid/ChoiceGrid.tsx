import type { ReactNode } from 'react';
import { LetterBadge } from '../../LetterBadge/LetterBadge';
import { RadioMark, type RadioTone } from '../../quiz/RadioMark/RadioMark';
import './ChoiceGrid.css';

export type GridResult = 'none' | 'selected' | 'correct' | 'wrong';

const TONE: Record<GridResult, RadioTone> = { none: 'neutral', selected: 'accent', correct: 'success', wrong: 'danger' };

/**
 * rc/Exam/ChoiceGrid (proposed, RC · Proposed — issue #138, screen 2.15): KET Reading Part 2 — a row per question, a
 * column per person (the shared options). Variants: Cell header (column: ui/LetterBadge Tone accent + name; row: number
 * + question) / choice (ChoiceGridCell: a ui/quiz/RadioMark in a 44px round target); Result none / correct / wrong
 * (+ selected while answering). Keeps the classes `part-grid`, `part-grid-q`, `part-grid-letter`, `part-grid-cell`
 * (+ is-selected / is-correct / is-wrong) and the inner `.option-radio` that the tests select.
 */
export function ChoiceGrid({ columns, children }: { columns: { id: string; label: ReactNode }[]; children: ReactNode }) {
  return (
    <table className="part-grid">
      <thead>
        <tr>
          <th scope="col" />
          {columns.map((c) => (
            <th key={c.id} scope="col">
              <LetterBadge className="part-grid-letter" tone="accent" bare>
                {c.id}
              </LetterBadge>{' '}
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

/** Cell header (row): the question; the choice cells follow as children */
export function ChoiceGridRow({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <tr>
      <th scope="row" className="part-grid-q">
        {head}
      </th>
      {children}
    </tr>
  );
}

/** Cell choice: one radio of the grid */
export function ChoiceGridCell({
  selected,
  checked,
  result = 'none',
  ariaLabel,
  disabled,
  onClick,
}: {
  /** the learner's choice (aria-checked) */
  selected: boolean;
  /** the dot: the choice, and the right answer in review */
  checked: boolean;
  result?: GridResult;
  ariaLabel: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <td>
      <button
        className={['part-grid-cell', result === 'none' ? '' : `is-${result}`].filter(Boolean).join(' ')}
        role="radio"
        aria-checked={selected}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={onClick}
      >
        <RadioMark checked={checked} tone={TONE[result]} />
      </button>
    </td>
  );
}
