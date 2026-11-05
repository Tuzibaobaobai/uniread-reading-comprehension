import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Cross } from '@/components/Icons';
import './TableCell.css';

/**
 * RC/Exam/TableCell (proposed, #127): an answer cell of a printed 表格填空 table (section.view "table").
 * Type select = a dropdown (the emoticons 🙂 ☹ 😐) — tap to open, tap an option; no native <select>.
 * Type text = a written cell (textarea). Result none / correct / wrong after submitting (written cells: the AI judge's
 * verdict against the reference answer). Labels come from the caller (i18n).
 */
export function TableCellSelect({
  n,
  options,
  value,
  correct,
  locked,
  onPick,
  ariaLabel,
  menuLabel,
  correctLabel,
}: {
  n: number;
  options: { id: string; content: ReactNode }[];
  value?: string;
  /** after submitting: the accepted option ids */
  correct?: string[];
  locked: boolean;
  onPick: (id: string) => void;
  ariaLabel: string;
  menuLabel: string;
  correctLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => root.current?.contains(e.target as Node) || setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const chosen = options.find((o) => o.id === value);
  const ok = locked && correct ? correct.includes(value ?? '') : null;
  const right = locked && correct && !ok ? options.find((o) => correct.includes(o.id)) : undefined;
  return (
    <span className="cell-select" ref={root}>
      <button
        type="button"
        className={`cell-select-button ${chosen ? 'is-filled' : ''} ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={locked}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="cell-num">{n}</span>
        <span className="cell-select-value">{chosen?.content ?? null}</span>
        {!locked && <ChevronDown />}
      </button>
      {right && (
        <span className="cell-select-correct" aria-label={correctLabel}>
          {right.content}
        </span>
      )}
      {open && (
        <span className="cell-select-menu" role="listbox" aria-label={menuLabel}>
          {options.map((o) => (
            <button
              type="button"
              key={o.id}
              role="option"
              aria-selected={o.id === value}
              className={`cell-select-item ${o.id === value ? 'is-current' : ''}`}
              onClick={() => {
                setOpen(false);
                onPick(o.id);
              }}
            >
              {o.content}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

export function TableCellText({
  n,
  value,
  result = 'none',
  locked,
  onChange,
  ariaLabel,
}: {
  n: number;
  value: string;
  result?: 'none' | 'correct' | 'wrong';
  locked: boolean;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <span className={`cell-text ${result === 'none' ? '' : `is-${result}`}`}>
      <span className="cell-num">
        {n} {result === 'correct' ? <Check /> : result === 'wrong' ? <Cross /> : null}
      </span>
      <textarea
        className="cell-text-input"
        value={value}
        readOnly={locked}
        rows={3}
        aria-label={ariaLabel}
        autoCapitalize="sentences"
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
}
