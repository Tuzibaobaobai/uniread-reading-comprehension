/**
 * Attempt status of an exam paper (KET/PET 真题) — shared by the playlist rows and the reader (GitHub #69, #70).
 * Pure: takes the saved attempt and the paper's official duration.
 */
import type { AttemptT, ExamItemT } from '@schema';
import { PAPER_SKILL, skillReport, type SkillReport } from './cambridge';
import type { Result } from './grading';

export type ExamStatus =
  | { kind: 'new' }
  /** started in practice mode, not submitted */
  | { kind: 'practicing' }
  /** exam mode, time still running */
  | { kind: 'examining'; endsAt: number }
  /** exam mode, time ran out without submitting (the learner left the page) */
  | { kind: 'timedOut' }
  /** submitted: raw score and Cambridge English Scale estimate (null while the judge is still scoring) */
  | { kind: 'done'; raw: number; max: number; report: SkillReport | null; pending: boolean };

/** exam mode ends at startedAt + the paper's official time */
export const examEndsAt = (attempt: AttemptT, durationMinutes: number) => Date.parse(attempt.startedAt) + durationMinutes * 60000;

export function examStatus(attempt: AttemptT | null, paper: ExamItemT['paper'], durationMinutes: number, now = Date.now()): ExamStatus {
  if (!attempt) return { kind: 'new' };
  if (attempt.status === 'submitted' && attempt.result) {
    const r = attempt.result as Result;
    const skill = PAPER_SKILL[paper];
    const report = skill ? skillReport(skill, r) : null;
    const pending = r.byQuestion.some((b) => b.scoredBy === 'pending');
    // raw = every question's points, including judged writing / speaking once scored
    const raw = r.byQuestion.reduce((n, b) => n + b.points, 0);
    const max = r.byQuestion.reduce((n, b) => n + b.maxPoints, 0);
    return { kind: 'done', raw: Math.round(raw * 2) / 2, max, report, pending };
  }
  if (attempt.mode === 'exam') {
    const endsAt = examEndsAt(attempt, durationMinutes);
    return now >= endsAt ? { kind: 'timedOut' } : { kind: 'examining', endsAt };
  }
  if (attempt.mode === 'practice') return { kind: 'practicing' };
  return Object.keys(attempt.responses).length ? { kind: 'practicing' } : { kind: 'new' };
}

/** playlist row label (#69: raw score and scaled score shown separately) */
export function examStatusLabel(s: ExamStatus): string | null {
  switch (s.kind) {
    case 'new':
      return null;
    case 'practicing':
      return '练习中';
    case 'examining':
      return '考试中';
    case 'timedOut':
      return '考试超时';
    case 'done':
      if (s.pending) return `原始分 ${s.raw}/${s.max} · 换算分评分中`;
      return `原始分 ${s.raw}/${s.max} · 换算分 ${s.report?.scale ?? '<82'}`;
  }
}
