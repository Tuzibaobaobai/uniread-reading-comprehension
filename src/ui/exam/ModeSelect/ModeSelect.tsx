import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from '@/components/Icons';
import { ModeMenu, type ModeMenuItem } from '@/ui/exam/ModeMenu/ModeMenu';
import './ModeSelect.css';

/**
 * RC/Exam/ModeSelect (proposed, issue #138; the designer's Ready-for-dev frames 2.02–2.07, Figma 19496:1129): the reader
 * header's mode select — 「当前」 (`current`), the current mode in bold, the exam countdown (rc/Exam/ExamTimer, `timer`)
 * and the chevron; tapping opens ui/exam/ModeMenu. Variants: Mode practice / exam; Open no / yes (brand border, the
 * chevron turned up; `defaultOpen` for screens; outside tap and Escape close it). Choosing an item closes the menu and
 * calls onSelect. Keeps .mode-select / .mode-select-button.
 */
export function ModeSelect<K extends string>({
  mode,
  current,
  label,
  ariaLabel,
  timer,
  menuLabel,
  items,
  onSelect,
  defaultOpen = false,
}: {
  mode: K;
  /** the prefix before the mode's name (「当前」) */
  current?: string;
  /** the current mode's name */
  label: string;
  ariaLabel: string;
  timer?: ReactNode;
  menuLabel: string;
  items: ModeMenuItem<K>[];
  onSelect: (key: K) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => root.current?.contains(e.target as Node) || setOpen(false);
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      root.current?.querySelector<HTMLElement>('.mode-select-button')?.focus();
    };
    // keyboard: tabbing out of the menu closes it
    const focusOut = (e: FocusEvent) => root.current?.contains(e.target as Node) || setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    document.addEventListener('focusin', focusOut);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
      document.removeEventListener('focusin', focusOut);
    };
  }, [open]);
  return (
    <div className={`mode-select is-${mode}`} ref={root}>
      <button type="button" className="mode-select-button" aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((o) => !o)}>
        {current && <span className="mode-select-current">{current}</span>}
        <b>{label}</b>
        {timer}
        <ChevronDown />
      </button>
      {open && (
        <ModeMenu
          label={menuLabel}
          items={items}
          onSelect={(k) => {
            setOpen(false);
            onSelect(k);
          }}
        />
      )}
    </div>
  );
}
