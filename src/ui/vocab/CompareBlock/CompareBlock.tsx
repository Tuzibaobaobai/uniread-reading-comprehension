import type { ReactNode } from 'react';
import './CompareBlock.css';

/** RC/Vocab/CompareBlock (proposed, 19445:512): 辨析 (高考) — the words compared, then the printed explanation. */
export function CompareBlock({ title, words, children }: { title: string; words: string; children: ReactNode }) {
  return (
    <div className="entry-compare">
      <b>
        {title} <span lang="en">{words}</span>
      </b>
      {children}
    </div>
  );
}
