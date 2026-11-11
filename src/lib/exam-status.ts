/**
 * Attempt status of an exam paper (KET/PET 真题) — shared by the playlist rows and the reader (GitHub #69, #70).
 * Pure: takes the saved attempt and the paper's official duration.
 */
import type { AttemptT, ExamItemT } from '@schema';
import { SCALES, paperReports, type ExamKey, type SkillReport } from './cambridge';
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
  | { kind: 'done'; raw: number; max: number; reports: SkillReport[]; pending: boolean; unjudged?: boolean; exam: ExamKey };

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
    // on Cambridge's own mark scale (A2 speaking out of 45, B1 speaking out of 30), as the score report shows it
    const raw = reports.length ? reports.reduce((n, x) => n + x.raw, 0) : counted.reduce((n, b) => n + b.points, 0);
    const max = reports.length ? reports.reduce((n, x) => n + x.scaleMax, 0) : counted.reduce((n, b) => n + b.maxPoints, 0);
    // judged answers the judge could not mark (it was down): no score yet, re-judged when the paper is opened again
    const unjudged = r.byQuestion.some((b) => b.scoredBy === 'self');
    return { kind: 'done', raw: Math.round(raw * 2) / 2, max, reports, pending, ...(unjudged ? { unjudged } : {}), exam };
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
    case 'done': {
      // a skill still being marked (or left for the AI while it was down) shows no raw mark: it is not a 0
      if (s.pending || s.unjudged)
        return s.reports
          .map((x) =>
            x.pending
              ? t('examStatus.skillPending', { skill: t(`skill.${x.skill}`) })
              : x.unjudged
                ? t('examStatus.skillUnjudged', { skill: t(`skill.${x.skill}`) })
                : t('examStatus.skillRaw', { skill: t(`skill.${x.skill}`), raw: x.raw, max: x.scaleMax }),
          )
          .join(' · ');
      // below the reported range: < the exam's own floor (A2 Key 82, B1 Preliminary 102)
      const below = `<${SCALES[s.exam].floor}`;
      // Reading & Writing reports two skills: 换算分 阅读 125 / 写作 130
      if (s.reports.length > 1)
        return t('examStatus.done', {
          raw: s.raw,
          max: s.max,
          scale: s.reports.map((x) => t('examStatus.skillScale', { skill: t(`skill.${x.skill}`), scale: x.scale ?? below })).join(' / '),
        });
      return t('examStatus.done', { raw: s.raw, max: s.max, scale: s.reports[0]?.scale ?? below });
    }
  }
}
