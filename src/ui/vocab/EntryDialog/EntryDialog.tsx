import type { ReactNode } from 'react';
import './EntryDialog.css';

/**
 * RC/Vocab/EntryDialog (proposed, 19445:703; the designer's frame 3.29): the review's 查看词条 — a white dialog (title +
 * an EntryCard) over the backdrop, its close button a dimmed 48 circle just outside the top right corner (inside the corner
 * on a narrow screen). Clicking the backdrop or the close button calls onClose.
 */
export function EntryDialog({ label, title, closeLabel, onClose, children }: { label: string; title: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog entry-dialog" role="dialog" aria-modal aria-label={label} onClick={(e) => e.stopPropagation()}>
        <h2 className="entry-dialog-title">{title}</h2>
        <button type="button" className="entry-dialog-close" onClick={onClose} aria-label={closeLabel}>
          <svg viewBox="0 0 48 48" aria-hidden fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M30 18L18 30M18 18l12 12" />
          </svg>
        </button>
        <div className="entry-dialog-body thin-scroll">{children}</div>
      </div>
    </div>
  );
}
