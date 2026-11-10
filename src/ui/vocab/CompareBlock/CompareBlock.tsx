import type { ReactNode } from 'react';
import './CompareBlock.css';

/** RC/Vocab/CompareBlock (proposed, 19445:507): 辨析 (高考) — a white box in a TipBox: the title line with the words compared, then the printed explanation. */
export function CompareBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="entry-compare">
      <b className="entry-compare-title">
        {title}
      </b>
      {children}
    </div>
  );
}
