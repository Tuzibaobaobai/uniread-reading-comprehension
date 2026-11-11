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

describe('final test 2026-11-12', () => {
  it('below the reported range shows the exam\'s own floor: A2 Key <82, B1 Preliminary <102', () => {
    const byQuestion = Array.from({ length: 32 }, (_, i) => ({ q: `q${i + 1}`, correct: false, points: 0, maxPoints: 1 }));
    const done = { ...base, itemId: 'pet1-t1-r', status: 'submitted' as const, result: { score: 0, maxScore: 32, byQuestion } };
    expect(examStatusLabel(examStatus(done, 'reading', 45, Date.now(), 'b1'))).toBe('原始分 0/32 · 换算分 <102');
    const ket = { ...done, result: { score: 0, maxScore: 25, byQuestion: byQuestion.slice(0, 25) } };
    expect(examStatusLabel(examStatus(ket, 'listening', 35, Date.now(), 'a2'))).toBe('原始分 0/25 · 换算分 <82');
  });
  it('a skill waiting for the AI shows no raw mark (not "0"); the other skill keeps its mark', () => {
    const reading = Array.from({ length: 30 }, (_, i) => ({ q: `q${i + 1}`, correct: i < 20, points: i < 20 ? 1 : 0, maxPoints: 1 }));
    const writing = ['q31', 'q32'].map((q) => ({ q, correct: null, points: 0, maxPoints: 15, scoredBy: 'self' as const }));
    const done = { ...base, itemId: 'ket1-t1-rw', status: 'submitted' as const, result: { score: 20, maxScore: 30, byQuestion: [...reading, ...writing] } };
    expect(examStatusLabel(examStatus(done, 'reading_writing', 60))).toBe('阅读原始分 20/30 · 写作待 AI 批改');
    const pending = { ...done, result: { ...done.result, byQuestion: [...reading, ...writing.map((w) => ({ ...w, scoredBy: 'pending' as const }))] } };
    expect(examStatusLabel(examStatus(pending, 'reading_writing', 60))).toBe('阅读原始分 20/30 · 写作评分中');
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
