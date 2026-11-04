import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from '@/components/Icons';
import { ModeMenu, type ModeMenuItem } from '@/ui/exam/ModeMenu/ModeMenu';
import './ModeSelect.css';

/**
 * RC/Exam/ModeSelect (proposed, issue #138; Figma 模式切换 19215-125693 → select 19215-125964): the reader header's
 * mode select — the current mode, the exam countdown (rc/Exam/ExamTimer, `timer`) and the chevron; tapping opens
 * ui/exam/ModeMenu. Variants: Mode practice / exam; Open no / yes (`defaultOpen` for screens; outside tap and
 * Escape close it). Choosing an item closes the menu and calls onSelect. Keeps .mode-select / .mode-select-button.
 */
export function ModeSelect<K extends string>({
  mode,
  label,
  ariaLabel,
  timer,
  menuLabel,
  items,
  onSelect,
  defaultOpen = false,
}: {
  mode: K;
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
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <div className={`mode-select is-${mode}`} ref={root}>
      <button type="button" className="mode-select-button" aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((o) => !o)}>
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
