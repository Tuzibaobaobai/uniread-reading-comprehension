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
 * RC/Exam/ScaleTable (proposed, issue #138): the Cambridge English Scale conversion table (#67) — one raw → scale
 * table per skill side by side, then the result bands. Tables are rc/Quiz/TableFill Cell=score (ScoreTable).
 * Shown inside rc/Common/Dialog (size l, `.scale-dialog` scrolls).
 */
export function ScaleTable({
  head,
  skills,
  grades,
}: {
  head: [ReactNode, ReactNode];
  skills: ScaleSkill[];
  grades: { caption: ReactNode; rows: { key: string | number; range: ReactNode; label: ReactNode }[] };
}) {
  return (
    <>
      <div className="scale-tables">
        {skills.map((k) => (
          <ScoreTable key={k.key} className="scale-table" caption={k.caption} head={head} rows={k.rows.map(([raw, scale]) => ({ key: raw, cells: [raw, scale] }))} />
        ))}
      </div>
      <ScoreTable caption={grades.caption} rows={grades.rows.map((r) => ({ key: r.key, cells: [r.range, r.label] }))} />
    </>
  );
}
