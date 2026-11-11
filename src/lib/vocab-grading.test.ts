// 词汇天天练 (#110): Chinese meaning matching, wordProfile / wordFamily scoring, hints at half marks
import { describe, expect, it } from 'vitest';
import type { AnswerKeyT, QuestionT } from '@schema';
import { examNotation, gradeItem, gradeQuestion, isAnswered, phraseMatches, zhMatches } from './grading';

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
  it('never accepts the opposite meaning: a sense that only adds or drops 不 / 无 / 非 … (final test 2026-11-12)', () => {
    expect(zhMatches('可能的', ['不可能的'])).toBe(false); // impossible
    expect(zhMatches('诚实的', ['不诚实的'])).toBe(false); // dishonest
    expect(zhMatches('喜欢', ['不喜欢；厌恶'])).toBe(false); // dislike
    expect(zhMatches('生命的', ['死的；无生命的'])).toBe(false); // dead
    expect(zhMatches('不可能', ['可能的'])).toBe(false); // the other way round
    expect(zhMatches('不可能的事', ['不可能的'])).toBe(true); // the negation is shared: still a match
    expect(zhMatches('死的', ['死的；无生命的'])).toBe(true);
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

describe('phrase notation (QA 2026-11-11): the words are graded, not the notation', () => {
  it('sb. / sth. with or without the dot or written out, … in any spacing, commas ignored', () => {
    expect(phraseMatches('accuse sb of', 'accuse sb. of')).toBe(true);
    expect(phraseMatches('accuse somebody of', 'accuse sb. of')).toBe(true);
    expect(phraseMatches('admire sb for sth', 'admire sb. for sth.')).toBe(true);
    expect(phraseMatches('bear...in mind', 'bear ... in mind')).toBe(true);
    expect(phraseMatches('bear … in mind', 'bear...in mind')).toBe(true);
    expect(phraseMatches('attach ( … ) to', 'attach (...) to')).toBe(true);
    expect(phraseMatches('laid, laid,laying', 'laid, laid, laying')).toBe(true);
  });
  it('a placeholder may be filled with a more specific one, and a pattern may be written out in full', () => {
    expect(phraseMatches('keep sb. from', 'keep...from')).toBe(true);
    expect(phraseMatches('keep sb. from doing sth.', 'keep...from')).toBe(true);
    expect(phraseMatches('prefer A to B', 'prefer...to...')).toBe(true);
    expect(phraseMatches('prefer sth. to sth.', 'prefer A to B')).toBe(true);
    expect(phraseMatches('accuse ... of', 'accuse sb. of')).toBe(true);
  });
  it('the placeholder is part of the pattern: leaving it out, or the wrong one, is wrong; spelling stays strict', () => {
    expect(phraseMatches('so that', 'so...that')).toBe(false); // 以便 ≠ 如此…以至于
    expect(phraseMatches('add to', 'add A to B')).toBe(false); // 增加 ≠ 把 A 加到 B 上
    expect(phraseMatches('accuse of', 'accuse sb. of')).toBe(false);
    expect(phraseMatches('accuse sth. of', 'accuse sb. of')).toBe(false);
    expect(phraseMatches('acuse sb. of', 'accuse sb. of')).toBe(false);
    expect(phraseMatches('avoid doing sth.', 'avoid')).toBe(false); // a plain word is not a pattern
    expect(phraseMatches('A friend in need', 'A friend in need')).toBe(true); // a sentence-initial A is a word
  });
  it('a spelling answer is a word, not notation: someone ≠ sb, somebody ≠ someone (regression 2026-11-12)', () => {
    expect(phraseMatches('sb', 'someone')).toBe(false);
    expect(phraseMatches('sb.', 'someone')).toBe(false);
    expect(phraseMatches('sth', 'something')).toBe(false);
    expect(phraseMatches('somebody', 'someone')).toBe(false);
    expect(phraseMatches('sb else', 'somebody else')).toBe(false);
    expect(phraseMatches('someone', 'someone')).toBe(true);
    // in a pattern key the learner may still write the placeholder out
    expect(phraseMatches('accuse someone of', 'accuse sb. of')).toBe(true);
  });
  it('nothing may be added after a complete pattern; a pattern ending in a preposition may take its object', () => {
    expect(phraseMatches('agree with sb. sth', 'agree with sb.')).toBe(false);
    expect(phraseMatches('have the ability to do sth. sth', 'have the ability to do sth.')).toBe(false);
    expect(phraseMatches('add A to B B', 'add A to B')).toBe(false);
    expect(phraseMatches("in sb.'s adult life sth", "in sb.'s adult life")).toBe(false);
    expect(phraseMatches('accuse sb. of sth.', 'accuse sb. of')).toBe(true);
    expect(phraseMatches('prevent sb. from doing', 'prevent ... from')).toBe(true);
  });
  it("…'s for sb.'s, a comma or semicolon between two halves, and capitals (final test 2026-11-12)", () => {
    expect(phraseMatches("awake ...'s sympathy", 'awake sb.’s sympathy')).toBe(true);
    expect(phraseMatches("awake someone's sympathy", 'awake sb.’s sympathy')).toBe(true);
    expect(phraseMatches('the former ..., the latter ...', 'The former ...; the latter ...')).toBe(true);
    expect(phraseMatches('the former ... the latter ...', 'The former ...; the latter ...')).toBe(true);
    expect(phraseMatches('GIVE SB A SOUND BOX ON THE EAR', 'give sb. a sound box on the ear')).toBe(true);
    expect(phraseMatches('Give Sb A Sound Box On The Ear', 'give sb. a sound box on the ear')).toBe(true);
    expect(phraseMatches('ADD A TO B', 'add A to B')).toBe(true);
    expect(phraseMatches('give sb. sound box on the ear', 'give sb. a sound box on the ear')).toBe(false);
  });
  it('only for 词汇天天练 days (gradeItem), not for 时文 / exam blanks', () => {
    const q = { id: 'q1', number: 1, points: 1, interaction: { kind: 'textEntry', prompt: [{ t: 'blank', id: 'b1', number: 1 }] } } as QuestionT;
    const key = { schemaVersion: '1.0', itemId: 'x', answerSource: 'official', reviewStatus: 'pending', answers: { q1: { slots: { b1: { accept: ['accuse sb. of'] } } } } } as never;
    const day = { id: 'zkv-d01', entryIds: ['e-a'], sections: [{ id: 's1', questions: [q] }] } as never;
    const exam = { id: 'ket1-t1-rw', article: { blocks: [] }, sections: [{ id: 's1', questions: [q] }] } as never;
    expect(gradeItem(day, key, { q1: { b1: 'accuse sb of' } }).byQuestion[0].correct).toBe(true);
    expect(gradeItem(exam, key, { q1: { b1: 'accuse sb of' } }).byQuestion[0].correct).toBe(false);
  });
});

describe('KET / PET time and price notation (final test 2026-11-12)', () => {
  it('ignores the notation an examiner ignores, nothing else', () => {
    expect(examNotation('7.45pm')).toBe(examNotation('7.45 pm'));
    expect(examNotation('7.45 p.m.')).toBe(examNotation('7.45 pm'));
    expect(examNotation('quarter  to  2')).toBe(examNotation('quarter to two')); // spaces collapse before the number word

    expect(examNotation('8.35AM').toLowerCase()).toBe(examNotation('8.35 am'));
    expect(examNotation('£ 6.30')).toBe('£6.30');
    expect(examNotation('$ 238')).toBe('$238');
    expect(examNotation('quarter to 8')).toBe('quarter to eight');
    expect(examNotation('7.46 pm')).not.toBe(examNotation('7.45 pm'));
  });
  it('applies to exam gap-fills only', () => {
    const q = { id: 'q1', number: 1, points: 1, interaction: { kind: 'textEntry', prompt: [{ t: 'blank', id: 'b1', number: 1 }] } } as QuestionT;
    const key = { schemaVersion: '1.0', itemId: 'x', answerSource: 'official', reviewStatus: 'pending', answers: { q1: { slots: { b1: { accept: ['7.45 pm', '£6.30'] } } } } } as never;
    const exam = { id: 'ket1-t1-l', format: 'exam', article: { blocks: [] }, sections: [{ id: 's1', questions: [q] }] } as never;
    const ci = { id: 'ci-g3-w01-mon', article: { blocks: [] }, sections: [{ id: 's1', questions: [q] }] } as never;
    for (const v of ['7.45pm', '7.45 p.m.', '£ 6.30']) expect(gradeItem(exam, key, { q1: { b1: v } }).byQuestion[0].correct).toBe(true);
    expect(gradeItem(exam, key, { q1: { b1: '7.15pm' } }).byQuestion[0].correct).toBe(false);
    expect(gradeItem(ci, key, { q1: { b1: '7.45pm' } }).byQuestion[0].correct).toBe(false);
  });
});
