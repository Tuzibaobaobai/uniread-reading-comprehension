import { describe, expect, it } from 'vitest';
import type { ItemKeyT, ItemT } from '@schema';
import { examKey, grade, paperReports, toScale } from './cambridge';
import { gradeItem } from './grading';

describe('B1 Preliminary scale (official practice-test anchors)', () => {
  it('hits the published anchors and caps at 170', () => {
    expect(toScale('reading', 23, 'b1')).toBe(140);
    expect(toScale('reading', 29, 'b1')).toBe(160);
    expect(toScale('writing', 24, 'b1')).toBe(140);
    expect(toScale('listening', 18, 'b1')).toBe(140);
    expect(toScale('speaking', 18, 'b1')).toBe(140);
    expect(toScale('reading', 32, 'b1')).toBe(170);
    expect(toScale('reading', 4, 'b1')).toBeNull();
  });
  it('maps to B1 Preliminary bands and picks the table from the exam name', () => {
    expect(grade(162, 'b1')).toBe('Grade A（B2）');
    expect(grade(155, 'b1')).toBe('Grade B（B1）');
    expect(grade(140, 'b1')).toBe('Grade C（B1）');
    expect(grade(125, 'b1')).toBe('A2');
    expect(examKey('B1 Preliminary for Schools')).toBe('b1');
    expect(examKey('A2 Key for Schools')).toBe('a2');
  });
  it('speaking: four judged criteria (no pronunciation) scaled to the 30-mark paper', () => {
    const j = (bands: Record<string, number>) => ({
      score: 0, maxPoints: 20, languageIssues: [], feedbackZh: '', confidence: 1, flags: [], needsReview: false, model: 'm', promptVersion: 'p', judgedAt: '',
      keyPoints: Object.entries(bands).map(([id, band]) => ({ id, met: 'partial' as const, band })),
    });
    const row = (q: string, bands: Record<string, number>) => ({ q, correct: null, points: 12, maxPoints: 20, scoredBy: 'judge' as const, judgement: j(bands) });
    const all3 = { grammar_vocabulary: 3, discourse_management: 3, interactive_communication: 3, global: 3 };
    const [r] = paperReports('speaking', { score: 24, maxScore: 40, byQuestion: [row('q1', all3), row('q2', all3)] }, 'b1');
    expect(r.raw).toBe(18); // (3+3+3+2·3) × 30/25
    expect(r.scale).toBe(140);
  });
});

describe('choose one of several tasks (PET Writing Part 2)', () => {
  const ext = (id: string, n: number) => ({ id, number: n, points: 20, skills: [], interaction: { kind: 'extendedText' as const, prompt: [], scoring: 'judge' as const } });
  const item = {
    schemaVersion: '1.0', format: 'exam', id: 'pet1-t1-w', playlistId: 'pet1', order: 2, test: 1, paper: 'writing', title: 'w', displayName: 'w',
    taskType: { code: 'exam_writing', labelZh: '写作' }, meta: { exam: 'B1 Preliminary for Schools', durationMinutes: 45, totalMarks: 40 },
    article: { images: [], blocks: [], vocabulary: [] },
    sections: [
      { id: 's1', part: 1, instruction: '', questions: [ext('q1', 1)] },
      { id: 's2', part: 2, instruction: '', choose: 1, questions: [ext('q2', 2), ext('q3', 3)] },
    ],
    source: { pdf: '', pdfPages: [], bookPages: [] }, status: { content: 'transcribed', version: '1.0.0' },
  } as unknown as ItemT;
  const key = { schemaVersion: '1.0', itemId: 'pet1-t1-w', answerSource: 'official', reviewStatus: 'pending', answers: { q1: { sampleAnswer: 'x' }, q2: { sampleAnswer: 'x' }, q3: { sampleAnswer: 'x' } } } as ItemKeyT;
  it('scores only the chosen task; the other is "none" and not counted', () => {
    const r = gradeItem(item, key, { q1: 'Dear Sam…', q3: 'Lois smiled…' });
    expect(r.byQuestion.map((b) => [b.q, b.scoredBy])).toEqual([
      ['q1', 'pending'],
      ['q2', 'none'],
      ['q3', 'pending'],
    ]);
    const [w] = paperReports('writing', { ...r, byQuestion: r.byQuestion.map((b) => (b.scoredBy === 'pending' ? { ...b, points: 15, scoredBy: 'judge' as const } : b)) }, 'b1');
    expect([w.raw, w.max]).toEqual([30, 40]);
  });
});
