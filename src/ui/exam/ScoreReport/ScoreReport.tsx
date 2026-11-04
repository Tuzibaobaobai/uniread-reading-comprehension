import type { ReactNode } from 'react';
import { ScoreTable } from '@/ui/quiz/TableFill/TableFill';
import { SkillScore } from '@/ui/exam/SkillScore/SkillScore';
import './ScoreReport.css';

export interface ReportPart {
  key: string;
  label: ReactNode;
  score: ReactNode;
}
export interface ReportSkill {
  key: string;
  name: ReactNode;
  scale: ReactNode;
  grade: ReactNode;
  raw: ReactNode;
  pending?: boolean;
}

/**
 * RC/Exam/ScoreReport (proposed, issue #138): the score report's content — the Part score table (rc/Quiz/TableFill
 * Cell=score), one ui/exam/SkillScore card per skill, and the note (with the ui/LinkButton to the conversion table).
 * Variant Pending no / yes (some answers still being marked). Shown inside rc/Common/Dialog (size m).
 */
export function ScoreReport({ head, parts, skills, note, pending = false }: { head: [ReactNode, ReactNode]; parts: ReportPart[]; skills: ReportSkill[]; note?: ReactNode; pending?: boolean }) {
  return (
    <div className={['score-report', pending ? 'is-pending' : ''].filter(Boolean).join(' ')}>
      <ScoreTable head={head} rows={parts.map((p) => ({ key: p.key, cells: [p.label, p.score] }))} />
      <div className="report-skills">
        {skills.map(({ key, ...s }) => (
          <SkillScore key={key} {...s} />
        ))}
      </div>
      {note && <p className="report-note">{note}</p>}
    </div>
  );
}
