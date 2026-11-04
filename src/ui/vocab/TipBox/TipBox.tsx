import type { ReactNode } from 'react';
import { ChevronDown } from '@/components/Icons';
import './TipBox.css';

/** RC/Vocab/TipBox (proposed, 19445:506): 名师点拨, Open = no (default, #134) / yes. */
export function TipBox({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className={`entry-tip ${open ? 'is-open' : ''}`}>
      <button type="button" className="entry-tip-toggle" aria-expanded={open} onClick={onToggle}>
        {title}
        <ChevronDown />
      </button>
      {open && children}
    </div>
  );
}
