import type { ReactNode } from 'react';
import { ScoreTable } from '@/ui/quiz/TableFill/TableFill';
import './ScaleTable.css';

export interface ScaleSkill {
  key: string;
  caption: ReactNode;
  /** [raw, scale] pairs, highest first */
  rows: [number, number][];
}

/**
 * RC/Exam/ScaleTable (proposed, issue #138; the designer's frame 2.12, Figma 19504:6380): the Cambridge English Scale
 * conversion table (#67) — one raw → scale table per skill side by side, then the result bands with their own header
 * row. Tables are rc/Quiz/TableFill Cell=score (ScoreTable), restyled inside `.scale-dialog` (grey header row, no rules).
 * Shown inside rc/Common/Dialog (size l; the dialog body scrolls).
 */
export function ScaleTable({
  head,
  skills,
  grades,
}: {
  head: [ReactNode, ReactNode];
  skills: ScaleSkill[];
  grades: { caption: ReactNode; head?: [ReactNode, ReactNode]; rows: { key: string | number; range: ReactNode; label: ReactNode }[] };
}) {
  return (
    <>
      <div className="scale-tables">
        {skills.map((k) => (
          <ScoreTable key={k.key} className="scale-table" caption={k.caption} head={head} rows={k.rows.map(([raw, scale]) => ({ key: raw, cells: [raw, scale] }))} />
        ))}
      </div>
      <ScoreTable className="scale-grades" caption={grades.caption} head={grades.head} rows={grades.rows.map((r) => ({ key: r.key, cells: [r.range, r.label] }))} />
    </>
  );
}
