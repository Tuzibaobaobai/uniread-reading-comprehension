import type { ReactNode } from 'react';
import './EntryDialog.css';

/**
 * RC/Vocab/EntryDialog (proposed, 19445:703): the review's 查看词条 — an EntryCard in a dialog over the backdrop;
 * close = UIKit-LearnNav btn-close. Clicking the backdrop or the close button calls onClose.
 */
export function EntryDialog({ label, closeLabel, onClose, children }: { label: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog entry-dialog" role="dialog" aria-modal aria-label={label} onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label={closeLabel}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
