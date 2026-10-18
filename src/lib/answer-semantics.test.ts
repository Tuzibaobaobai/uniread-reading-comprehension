/**
 * Answer semantics per interaction (docs/14 §7, §9): unanswered, normal, partial / cleared draft,
 * illegal ids, restore. Expected values are written by hand from the rules in docs/02 / docs/14 —
 * not produced by the grader under test.
 */
import { describe, expect, it } from 'vitest';
import type { QuestionT } from '@schema';
import { gradeQuestion, isAnswered, type ResponseValue } from './grading';

const q = (interaction: QuestionT['interaction'], points = 1): QuestionT => ({ id: 'q1', number: 1, points, skills: ['detail'], interaction }) as QuestionT;
const blank = (id: string, firstLetter?: string) => ({ t: 'blank' as const, id, ...(firstLetter ? { hint: { firstLetter } } : {}) });
const hints = new Map<string, string>();
const grade = (qq: QuestionT, key: object, r: ResponseValue | undefined, h = hints) => gradeQuestion(qq, key as never, r, h);

const choice = q({ kind: 'choice', variant: 'standard', maxChoices: 1, prompt: [], options: ['A', 'B', 'C', 'D'].map((id) => ({ id, content: [] })) });
const gap2 = q({ kind: 'gapMatch', prompt: [blank('b1'), blank('b2')] }, 2);
const text2 = q({ kind: 'textEntry', prompt: [blank('b1', 'w'), blank('b2')] }, 2);
const match = q({ kind: 'match', left: [{ id: '1', content: [] }, { id: '2', content: [] }], right: [{ id: 'A', content: [] }, { id: 'B', content: [] }] }, 2);
const order = q({ kind: 'order', items: ['w1', 'w2', 'w3'].map((id) => ({ id, content: [] })), ending: '.' });
const open = q({ kind: 'extendedText', prompt: [], scoring: 'judge' }, 2);

describe('single choice / true-false', () => {
  const key = { correct: ['B'] };
  it('unanswered: not answered, 0 points', () => {
    expect(isAnswered(choice, undefined)).toBe(false);
    expect(isAnswered(choice, [])).toBe(false);
    expect(grade(choice, key, undefined)).toMatchObject({ correct: false, points: 0 });
  });
  it('normal answer', () => expect(grade(choice, key, ['B'])).toMatchObject({ correct: true, points: 1 }));
  it('illegal option id or more than one option is wrong, never an error', () => {
    expect(grade(choice, key, ['Z'])).toMatchObject({ correct: false, points: 0 });
    expect(grade(choice, key, ['B', 'C'])).toMatchObject({ correct: false, points: 0 });
  });
});

describe('shared word bank (gapMatch)', () => {
  const key = { correct: ['C', 'A'] };
  it('partial draft: not answered; per-blank credit', () => {
    expect(isAnswered(gap2, { b1: 'C' })).toBe(false);
    expect(grade(gap2, key, { b1: 'C' })).toMatchObject({ correct: false, points: 1, parts: { b1: true, b2: false } });
  });
  it('illegal bank id or unknown blank id earns nothing', () => {
    expect(grade(gap2, key, { b1: 'Q', b9: 'A' })).toMatchObject({ points: 0, parts: { b1: false, b2: false } });
  });
  it('complete and correct', () => expect(grade(gap2, key, { b1: 'C', b2: 'A' })).toMatchObject({ correct: true, points: 2 }));
});

describe('text entry', () => {
  const key = { slots: { b1: { accept: ['warmer'] }, b2: { accept: ["hadn't"] } } };
  it('empty / whitespace strings count as unanswered', () => {
    expect(isAnswered(text2, { b1: '', b2: '  ' })).toBe(false);
    expect(isAnswered(text2, { b1: 'armer' })).toBe(false);
  });
  it('first-letter remainder, case and curly apostrophe are accepted', () => {
    expect(grade(text2, key, { b1: 'armer', b2: 'Hadn’t' }, new Map([['b1', 'w']]))).toMatchObject({ correct: true, points: 2 });
  });
  it('per-blank partial credit by default; scoring "all" gives none', () => {
    expect(grade(text2, key, { b1: 'warmer', b2: 'had' }).points).toBe(1);
    const all = q({ ...(text2.interaction as object), scoring: 'all' } as QuestionT['interaction'], 2);
    expect(grade(all, key, { b1: 'warmer', b2: 'had' }).points).toBe(0);
  });
});

describe('match', () => {
  const key = { pairs: { '1': 'B', '2': 'A' } };
  it('partial pairing: not answered, credit per correct pair', () => {
    expect(isAnswered(match, { '1': 'B' })).toBe(false);
    expect(grade(match, key, { '1': 'B' })).toMatchObject({ points: 1, parts: { '1': true, '2': false } });
  });
  it('re-using one right item or an illegal id only scores the true pair', () => {
    expect(grade(match, key, { '1': 'B', '2': 'B' }).points).toBe(1);
    expect(grade(match, key, { '1': 'X', '2': 'A' }).points).toBe(1);
  });
});

describe('order (连词成句)', () => {
  const key = { sequences: [['w2', 'w1', 'w3'], ['w3', 'w1', 'w2']] };
  it('partial draft is not answered and scores 0', () => {
    expect(isAnswered(order, ['w2', 'w1'])).toBe(false);
    expect(grade(order, key, ['w2', 'w1'])).toMatchObject({ correct: false, points: 0 });
  });
  it('any listed order is right; duplicate or illegal chunk ids are wrong', () => {
    expect(grade(order, key, ['w3', 'w1', 'w2']).correct).toBe(true);
    expect(grade(order, key, ['w2', 'w2', 'w3']).correct).toBe(false);
    expect(grade(order, key, ['w2', 'w1', 'w9']).correct).toBe(false);
  });
});

describe('constructed response (extendedText)', () => {
  it('rule grading never scores it: pending until the judge (or a teacher) decides', () => {
    expect(isAnswered(open, '   ')).toBe(false);
    expect(grade(open, { sampleAnswer: 'x', keyPoints: [] }, 'They lose water.')).toMatchObject({ correct: null, points: 0, scoredBy: 'pending' });
  });
  it('self-assessment is not a score', () => {
    const self = q({ kind: 'extendedText', prompt: [], scoring: 'self' }, 2);
    expect(grade(self, { sampleAnswer: 'x' }, 'anything')).toMatchObject({ points: 0, scoredBy: 'self' });
  });
});

