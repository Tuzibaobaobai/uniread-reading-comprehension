import type { ReactNode } from 'react';
import { ChevronDown } from '@/components/Icons';
import './TipBox.css';

/**
 * The disclosure row of RC/Vocab/TipBox (Figma 拓展 19614:126447): a 20 × 20 white square with a chevron, then the
 * label (S medium, black/80). Also the "常用词组 · 词形拓展" row of an entry.
 */
export function TipToggle({ label, open, onToggle, ariaLabel, controls }: { label: string; open: boolean; onToggle: () => void; ariaLabel?: string; controls?: string }) {
  return (
    <button type="button" className="entry-tip-toggle" aria-expanded={open} aria-controls={controls} aria-label={ariaLabel} onClick={onToggle}>
      <span className="entry-tip-chev">
        <ChevronDown />
      </span>
      {label}
    </button>
  );
}

/** RC/Vocab/TipBox (proposed, 19445:496): 名师点拨 / 辨析, Open = no (default, #134) / yes (a white body box under the row). */
export function TipBox({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className={`entry-tip ${open ? 'is-open' : ''}`}>
      <TipToggle label={title} open={open} onToggle={onToggle} />
      {open && <div className="entry-tip-body">{children}</div>}
    </div>
  );
}
