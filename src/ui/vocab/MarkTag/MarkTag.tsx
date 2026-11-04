import type { ReactNode } from 'react';
import './MarkTag.css';

/** RC/Vocab/MarkTag (proposed, 19445:483): handbook marks — Kind = level / textbook (tag) · star / supplement (symbol). */
export function MarkTag({ kind, title, label, children }: { kind: 'level' | 'textbook' | 'star' | 'supplement'; title?: string; label?: string; children: ReactNode }) {
  return (
    <span className={kind === 'star' || kind === 'supplement' ? 'entry-star' : 'entry-tag'} title={title} aria-label={label}>
      {children}
    </span>
  );
}
