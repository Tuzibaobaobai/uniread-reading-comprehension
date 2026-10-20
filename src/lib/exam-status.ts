/**
 * Attempt status of an exam paper (KET/PET 真题) — shared by the playlist rows and the reader (GitHub #69, #70).
 * Pure: takes the saved attempt and the paper's official duration.
 */
import type { AttemptT, ExamItemT } from '@schema';
import { paperReports, type ExamKey, type Skill, type SkillReport } from './cambridge';
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
  | { kind: 'done'; raw: number; max: number; reports: SkillReport[]; pending: boolean };

/** exam mode ends at startedAt + the paper's official time */
export const examEndsAt = (attempt: AttemptT, durationMinutes: number) => Date.parse(attempt.startedAt) + durationMinutes * 60000;

export function examStatus(
  attempt: AttemptT | null,
  paper: ExamItemT['paper'],
  durationMinutes: number,
  now = Date.now(),
  exam: ExamKey = 'a2',
): ExamStatus {
  if (!attempt) return { kind: 'new' };
  if (attempt.status === 'submitted' && attempt.result) {
    const r = attempt.result as Result;
    const reports = paperReports(paper, r, exam);
    const pending = r.byQuestion.some((b) => b.scoredBy === 'pending');
    // raw = every question's points, including judged writing / speaking once scored
    // raw / max over the questions that count (an unchosen PET writing task is scoredBy "none")
    const counted = r.byQuestion.filter((b) => b.scoredBy !== 'none');
    const raw = counted.reduce((n, b) => n + b.points, 0);
    const max = counted.reduce((n, b) => n + b.maxPoints, 0);
    return { kind: 'done', raw: Math.round(raw * 2) / 2, max, reports, pending };
  }
  if (attempt.mode === 'exam') {
    const endsAt = examEndsAt(attempt, durationMinutes);
    return now >= endsAt ? { kind: 'timedOut' } : { kind: 'examining', endsAt };
  }
  if (attempt.mode === 'practice') return { kind: 'practicing' };
  return Object.keys(attempt.responses).length ? { kind: 'practicing' } : { kind: 'new' };
}

const SKILL_ZH: Record<Skill, string> = { reading: '阅读', writing: '写作', listening: '听力', speaking: '口语' };

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
      // Reading & Writing reports two skills: 换算分 阅读 125 / 写作 130
      if (s.reports.length > 1) return `原始分 ${s.raw}/${s.max} · 换算分 ${s.reports.map((x) => `${SKILL_ZH[x.skill]} ${x.scale ?? '<82'}`).join(' / ')}`;
      return `原始分 ${s.raw}/${s.max} · 换算分 ${s.reports[0]?.scale ?? '<82'}`;
  }
}
