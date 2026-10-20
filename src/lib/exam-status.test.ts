import { describe, expect, it } from 'vitest';
import type { AttemptT } from '@schema';
import { examStatus, examStatusLabel } from './exam-status';
import { overallScale, type SkillReport } from './cambridge';

const base: AttemptT = {
  attemptId: 'a',
  itemId: 'ket1-t1-l',
  itemVersion: '1.0.0',
  learnerId: null,
  startedAt: '2026-10-20T10:00:00.000Z',
  submittedAt: null,
  durationSec: 0,
  status: 'in_progress',
  responses: {},
  result: null,
};
const at = (iso: string) => Date.parse(iso);

describe('exam paper status (#70)', () => {
  it('practice / exam in progress / timed out', () => {
    expect(examStatusLabel(examStatus({ ...base, mode: 'practice' }, 'listening', 35))).toBe('练习中');
    expect(examStatusLabel(examStatus({ ...base, mode: 'exam' }, 'listening', 35, at('2026-10-20T10:20:00Z')))).toBe('考试中');
    expect(examStatusLabel(examStatus({ ...base, mode: 'exam' }, 'listening', 35, at('2026-10-20T10:35:00Z')))).toBe('考试超时');
    expect(examStatus(null, 'listening', 35).kind).toBe('new');
  });
  it('submitted: raw score and the scaled score shown separately (#69)', () => {
    const byQuestion = Array.from({ length: 25 }, (_, i) => ({ q: `q${i + 1}`, correct: i < 17, points: i < 17 ? 1 : 0, maxPoints: 1 }));
    const done = { ...base, status: 'submitted' as const, mode: 'exam' as const, result: { score: 17, maxScore: 25, byQuestion } };
    expect(examStatusLabel(examStatus(done, 'listening', 35))).toBe('原始分 17/25 · 换算分 120');
  });
  it('Reading & Writing shows both scaled scores (#73: one paper, two skills)', () => {
    const reading = Array.from({ length: 30 }, (_, i) => ({ q: `q${i + 1}`, correct: i < 20, points: i < 20 ? 1 : 0, maxPoints: 1 }));
    const writing = ['q31', 'q32'].map((q) => ({ q, correct: false, points: 9, maxPoints: 15, scoredBy: 'judge' as const }));
    const done = { ...base, itemId: 'ket1-t1-rw', status: 'submitted' as const, result: { score: 38, maxScore: 60, byQuestion: [...reading, ...writing] } };
    expect(examStatusLabel(examStatus(done, 'reading_writing', 60))).toBe('原始分 38/60 · 换算分 阅读 120 / 写作 120');
  });
});

describe('KET overall score (#68)', () => {
  const r = (skill: SkillReport['skill'], scale: number | null): SkillReport => ({ skill, raw: 0, max: 0, scaleMax: 0, scale, pending: false });
  it('is the average of the four skills, only when all four are scored', () => {
    expect(overallScale({ reading: r('reading', 140), writing: r('writing', 130), listening: r('listening', 120), speaking: r('speaking', 131) })).toBe(130);
    expect(overallScale({ reading: r('reading', 140), writing: r('writing', 130), listening: r('listening', 120) })).toBeNull();
    expect(overallScale({ reading: r('reading', 140), writing: r('writing', null), listening: r('listening', 120), speaking: r('speaking', 131) })).toBeNull();
  });
});
