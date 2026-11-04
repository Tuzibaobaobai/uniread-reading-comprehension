import type { ReactNode } from 'react';
import './StudyToolbar.css';

/** RC/Vocab/StudyToolbar (proposed, 19445:666): entry count, Scan tally (+ unmarked note), and the marks legend. */
export function StudyToolbar({ count, tally, legend }: { count: string; tally: string; legend?: ReactNode }) {
  return (
    <div className="vocab-toolbar">
      <span className="vocab-count">{count}</span>
      <span className="vocab-tally" role="status">
        {tally}
      </span>
      {legend}
    </div>
  );
}

/** the legend line under the counts: one item per mark used today */
export function StudyLegend({ items }: { items: { key: string; symbol: ReactNode; description: string }[] }) {
  if (!items.length) return null;
  return (
    <p className="vocab-legend">
      {items.map((m) => (
        <span key={m.key} className="vocab-legend-item">
          {m.symbol}
          {m.description}
        </span>
      ))}
    </p>
  );
}
