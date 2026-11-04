import type { ReactNode } from 'react';
import './ScanSummary.css';

/** RC/Vocab/ScanSummary (proposed, 19443:530): 速览完成小结 — title, tally, two actions (ui/QuizButton). */
export function ScanSummary({ title, tally, actions }: { title: string; tally: string; actions: ReactNode }) {
  return (
    <div className="scan-stage scan-done">
      <h2 className="scan-done-title">{title}</h2>
      <p className="scan-done-tally">{tally}</p>
      <div className="scan-done-actions">{actions}</div>
    </div>
  );
}
