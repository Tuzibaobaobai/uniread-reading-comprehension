/**
 * Attempt status of an exam paper (KET/PET 真题) — shared by the playlist rows and the reader (GitHub #69, #70).
 * Pure: takes the saved attempt and the paper's official duration.
 */
import type { AttemptT, ExamItemT } from '@schema';
import { paperReports, type ExamKey, type SkillReport } from './cambridge';
import type { Result } from './grading';
import { t as i18nT, type TFunction } from '@/i18n';

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

/** playlist row label (#69: raw score and scaled score shown separately); `t` defaults to the current language */
export function examStatusLabel(s: ExamStatus, t: TFunction = i18nT): string | null {
  switch (s.kind) {
    case 'new':
      return null;
    case 'practicing':
      return t('examStatus.practicing');
    case 'examining':
      return t('examStatus.examining');
    case 'timedOut':
      return t('examStatus.timedOut');
    case 'done':
      if (s.pending) return t('examStatus.donePending', { raw: s.raw, max: s.max });
      // Reading & Writing reports two skills: 换算分 阅读 125 / 写作 130
      if (s.reports.length > 1)
        return t('examStatus.done', {
          raw: s.raw,
          max: s.max,
          scale: s.reports.map((x) => t('examStatus.skillScale', { skill: t(`skill.${x.skill}`), scale: x.scale ?? '<82' })).join(' / '),
        });
      return t('examStatus.done', { raw: s.raw, max: s.max, scale: s.reports[0]?.scale ?? '<82' });
  }
}
