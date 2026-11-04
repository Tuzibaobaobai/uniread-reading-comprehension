import type { ReactNode } from 'react';
import './SkillScore.css';

/**
 * ui/exam/SkillScore — extends UniRead UIKit-Dashboard · data card (13621:128302) (`ui/exam/SkillScore`, issue #138):
 * one skill in the score report — skill name, Cambridge English Scale score, grade, raw score. Variant Pending
 * no / yes (writing / speaking still being marked: the caller passes the pending texts). Keeps .report-skill*.
 */
export function SkillScore({ name, scale, grade, raw, pending = false }: { name: ReactNode; scale: ReactNode; grade: ReactNode; raw: ReactNode; pending?: boolean }) {
  return (
    <div className={['report-skill', pending ? 'is-pending' : ''].filter(Boolean).join(' ')}>
      <span className="report-skill-name">{name}</span>
      <span className="report-skill-scale">{scale}</span>
      <span className="report-skill-grade">{grade}</span>
      <span className="report-skill-raw">{raw}</span>
    </div>
  );
}
