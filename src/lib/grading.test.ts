import { describe, expect, it } from 'vitest';
import type { ItemKeyT, ItemT, QuestionT } from '@schema';
import { gradeItem, gradeQuestion, isAnswered, normalizeText } from './grading';

const q = (id: string, interaction: QuestionT['interaction'], points = 1): QuestionT => ({
  id,
  number: Number(id.slice(1)),
  points,
  skills: [],
  interaction,
});
const opts = ['A', 'B', 'C'].map((id) => ({ id, content: [{ t: 'text' as const, v: id }] }));

describe('normalizeText', () => {
  it('unifies quotes, case, spaces and trailing punctuation', () => {
    expect(normalizeText('  Don’t   Worry. ')).toBe("don't worry");
    expect(normalizeText('Colour', true)).toBe('Colour');
  });
});

describe('gradeQuestion', () => {
  const hints = new Map([['b2', 'n']]);

  it('choice', () => {
    const choice = q('q1', { kind: 'choice', variant: 'standard', maxChoices: 1, prompt: [], options: opts });
    expect(gradeQuestion(choice, { correct: ['B'] }, ['B'], hints).correct).toBe(true);
    expect(gradeQuestion(choice, { correct: ['B'] }, ['A'], hints).correct).toBe(false);
    expect(gradeQuestion(choice, { correct: ['B'] }, undefined, hints).points).toBe(0);
  });

  it('gapMatch with two blanks gives partial credit', () => {
    const gm = q('q2', {
      kind: 'gapMatch',
      prompt: [
        { t: 'blank', id: 'b1' },
        { t: 'text', v: ' and ' },
        { t: 'blank', id: 'b3' },
      ],
    });
    const r = gradeQuestion(gm, { correct: ['A', 'D'] }, { b1: 'A', b3: 'C' }, hints);
    expect(r.correct).toBe(false);
    expect(r.points).toBe(0.5);
    expect(r.parts).toEqual({ b1: true, b3: false });
  });

  it('textEntry accepts variants and first-letter remainder', () => {
    const te = q('q3', { kind: 'textEntry', blankIds: ['b2'] });
    const key = { slots: { b2: { accept: ['nice'] } } };
    expect(gradeQuestion(te, key, { b2: 'Nice' }, hints).correct).toBe(true);
    expect(gradeQuestion(te, key, { b2: 'ice' }, hints).correct).toBe(true);
    expect(gradeQuestion(te, key, { b2: 'nise' }, hints).correct).toBe(false);
  });

  it('match scores per pair', () => {
    const m = q(
      'q4',
      {
        kind: 'match',
        left: ['1', '2'].map((id) => ({ id, content: [] })),
        right: ['A', 'B'].map((id) => ({ id, content: [] })),
      },
      2,
    );
    const r = gradeQuestion(m, { pairs: { '1': 'B', '2': 'A' } }, { '1': 'B', '2': 'B' }, hints);
    expect(r.points).toBe(1);
    expect(r.correct).toBe(false);
  });

  it('extendedText is not auto-scored', () => {
    const et = q('q5', { kind: 'extendedText', prompt: [], scoring: 'self' });
    expect(gradeQuestion(et, { sampleAnswer: 'x' }, 'my answer', hints).correct).toBeNull();
  });
});

describe('gradeItem / isAnswered', () => {
  const item = {
    article: { images: [], vocabulary: [], blocks: [{ id: 'p1', type: 'paragraph', content: [{ t: 'blank', id: 'b1', hint: { firstLetter: 'w' } }] }] },
    sections: [
      {
        id: 's1',
        instruction: '',
        questions: [
          q('q1', { kind: 'textEntry', blankIds: ['b1'] }),
          q('q2', { kind: 'extendedText', prompt: [], scoring: 'self' }),
        ],
      },
    ],
  } as unknown as ItemT;
  const key = {
    answers: { q1: { slots: { b1: { accept: ['water'] } } }, q2: { sampleAnswer: 'x' } },
  } as unknown as ItemKeyT;

  it('excludes extendedText from max score and uses hints', () => {
    const r = gradeItem(item, key, { q1: { b1: 'ater' }, q2: 'hi' });
    expect(r).toMatchObject({ score: 1, maxScore: 1 });
  });

  it('isAnswered requires every blank', () => {
    expect(isAnswered(item.sections[0].questions[0], { b1: ' ' })).toBe(false);
    expect(isAnswered(item.sections[0].questions[0], { b1: 'water' })).toBe(true);
  });
});
