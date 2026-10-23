// 词汇天天练 (#110): Chinese meaning matching, wordProfile / wordFamily scoring, hints at half marks
import { describe, expect, it } from 'vitest';
import type { AnswerKeyT, QuestionT } from '@schema';
import { gradeQuestion, isAnswered, zhMatches } from './grading';

const profile: QuestionT = {
  id: 'q1', number: 1, points: 3,
  interaction: { kind: 'wordProfile', prompt: [{ t: 'text', v: '/əˈbrɔːd/' }], posOptions: ['n.', 'v.', 'adv.'] },
} as QuestionT;
const profileKey = { word: ['abroad'], pos: ['adv.'], zh: ['到（在）国外'] } as AnswerKeyT;
const family: QuestionT = {
  id: 'q21', number: 21, points: 4,
  interaction: { kind: 'wordFamily', base: { word: 'enable', pos: 'v.' }, slots: [{ id: 'f1', pos: 'adj.' }, { id: 'f2', pos: 'adj.' }] },
} as QuestionT;
const familyKey = { forms: { f1: { word: ['able'], zh: ['能够的；有能力的'] }, f2: { word: ['unable'], zh: ['不能的'] } } } as AnswerKeyT;
const none = new Map<string, string>();

describe('zhMatches', () => {
  it('accepts any sense, other punctuation, and wording that contains or is contained in a sense', () => {
    expect(zhMatches('才能', ['能力，才能，本领'])).toBe(true);
    expect(zhMatches('事故', ['事故；意外；偶然的事'])).toBe(true);
    expect(zhMatches('偶然事件', ['事故；意外；偶然的事'])).toBe(true);
    expect(zhMatches('意义', ['事故；意外；偶然的事'])).toBe(false);
    expect(zhMatches('能够', ['能够的；有能力的'])).toBe(true);
  });
  it('reads a bracket as an alternative or optional wording', () => {
    expect(zhMatches('在国外', ['到（在）国外'])).toBe(true);
    expect(zhMatches('到国外', ['到（在）国外'])).toBe(true);
  });
  it('rejects empty and one-character partial answers', () => {
    expect(zhMatches('', ['能力'])).toBe(false);
    expect(zhMatches('能', ['能力'])).toBe(false);
  });
});

describe('wordProfile', () => {
  it('scores word, part of speech and meaning a third each', () => {
    const r = gradeQuestion(profile, profileKey, { word: 'abord', pos: 'adv.', zh: '在国外' }, none);
    expect(r).toMatchObject({ correct: false, points: 2, parts: { word: false, pos: true, zh: true } });
    expect(isAnswered(profile, { word: 'a', pos: 'adv.' })).toBe(false);
  });
  it('a word spelt with the hint earns half of its third', () => {
    const r = gradeQuestion(profile, profileKey, { word: 'Abroad ', pos: 'adv.', zh: '在国外' }, none, new Set(['q1:word']));
    expect(r.correct).toBe(true);
    expect(r.points).toBeCloseTo(2.5);
  });
  it('a meaning accepted by the server check counts', () => {
    const r = gradeQuestion(profile, profileKey, { word: 'abroad', pos: 'adv.', zh: '海外' }, none, new Set(), new Set(['q1:zh']));
    expect(r.points).toBe(3);
  });
});

describe('wordFamily', () => {
  it('slots with the same part of speech may be answered in any order; a meaning needs its word', () => {
    const r = gradeQuestion(family, familyKey, { 'f1.word': 'unable', 'f1.zh': '不能的', 'f2.word': 'able', 'f2.zh': '有能力的' }, none);
    expect(r).toMatchObject({ correct: true, points: 4 });
    const half = gradeQuestion(family, familyKey, { 'f1.word': 'abel', 'f1.zh': '能够的', 'f2.word': 'unable', 'f2.zh': '不能的' }, none, new Set(['q21:f2.word']));
    expect(half.parts).toMatchObject({ 'f1.word': false, 'f1.zh': false, 'f2.word': true, 'f2.zh': true });
    expect(half.points).toBeCloseTo(1.5); // 4 × (0 + 0 + ½ + 1) / 4
  });
});
