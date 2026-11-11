import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ExamItemT, ItemKeyT } from '@schema';
import { allQuestions, gradeItem, isAnswered } from './grading';
import { CAMBRIDGE_PROMPT_VERSION, buildJudgePrompt, buildJudgeRequest, emptyJudgement, fallbackToSelf, isBlankResponse, parseJudgement, retryUnjudged, shortCircuit, speakingTranscript } from './judge';
import { examStatus, examStatusLabel } from './exam-status';
import type { AttemptT } from '@schema';
import { examReport } from './cambridge';

const load = <T>(p: string) => JSON.parse(readFileSync(new URL(`../../content/playlists/ket1/${p}`, import.meta.url), 'utf8')) as T;
const rw = load<ExamItemT>('items/ket1-t1-rw.json');
const rwKey = load<ItemKeyT>('keys/ket1-t1-rw.json');
const sp = load<ExamItemT>('items/ket1-t1-s.json');
const spKey = load<ItemKeyT>('keys/ket1-t1-s.json');
const q = (item: ExamItemT, id: string) => allQuestions(item).find((x) => x.id === id)!;
const extended = (key: ItemKeyT, id: string) => key.answers[id] as Extract<ItemKeyT['answers'][string], { sampleAnswer: string }>;

describe('Cambridge A2 Key writing judge', () => {
  const req = buildJudgeRequest(rw, q(rw, 'q31'), extended(rwKey, 'q31'), 'Dear Lee, we are going camping next weekend. Do you want to come? Bring a sleeping bag.');
  it('builds a Cambridge request with the three criteria (5 each) and the task material only', () => {
    expect(req.promptVersion).toBe(CAMBRIDGE_PROMPT_VERSION);
    expect(req.rubric.type).toBe('cambridge_a2_writing');
    expect(req.rubric.keyPoints.map((k) => [k.id, k.weight])).toEqual([
      ['content', 5],
      ['organisation', 5],
      ['language', 5],
    ]);
    expect(req.question.text).toContain('25 words or more');
    const { system } = buildJudgePrompt(req, 'json');
    expect(system).toContain('Writing assessment scale (A2 Key');
  });
  it('scores the sum of the bands and derives met from the band', () => {
    const j = parseJudgement(
      {
        keyPoints: [
          { id: 'content', met: 'yes', band: 4 },
          { id: 'organisation', met: 'yes', band: 3 },
          { id: 'language', met: 'no', band: 9 },
        ],
        score: 1,
        languageIssues: [],
        feedbackZh: '不错。',
        confidence: 0.9,
        flags: [],
      },
      req,
      'test',
    );
    expect(j.keyPoints.map((k) => [k.band, k.met])).toEqual([
      [4, 'partial'],
      [3, 'partial'],
      [5, 'yes'],
    ]);
    expect(j.score).toBe(12);
    expect(j.confidence).toBeLessThanOrEqual(0.5); // the model's own score disagreed
  });
  it('an answer that ignores the task (content 0) gets no marks on any criterion', () => {
    const j = parseJudgement(
      {
        keyPoints: [
          { id: 'content', met: 'no', band: 0 },
          { id: 'organisation', met: 'partial', band: 3 },
          { id: 'language', met: 'partial', band: 3 },
        ],
        score: 6,
        languageIssues: [],
        feedbackZh: '内容和题目无关。',
        confidence: 0.9,
        flags: [],
      },
      req,
      'test',
    );
    expect(j.keyPoints.map((k) => k.band)).toEqual([0, 0, 0]);
    expect(j.score).toBe(0);
    expect(j.flags).toContain('off_topic');
    expect(j.needsReview).toBe(false);
  });
  it('a partly relevant answer (content 1+) keeps its other bands; the prompt states the rule for writing only', () => {
    const j = parseJudgement(
      { keyPoints: [{ id: 'content', met: 'partial', band: 1 }, { id: 'organisation', band: 3, met: 'partial' }, { id: 'language', band: 3, met: 'partial' }], score: 7, languageIssues: [], feedbackZh: '好。', confidence: 0.9, flags: [] },
      req,
      'test',
    );
    expect(j.score).toBe(7);
    expect(buildJudgePrompt(req, 'json').system).toContain('every criterion 0');
    const speak = buildJudgeRequest(sp, q(sp, 'q1'), extended(spKey, 'q1'), JSON.stringify({ t1: 'My name is Lily.' }));
    // speaking has its own rule (QA 2026-11-12): unrelated to every question / no attempt → no marks
    expect(buildJudgePrompt(speak, 'json').system).toContain('unrelated to every question');
    expect(buildJudgePrompt(speak, 'json').system).toContain('Never correct or mention spelling');
    expect(buildJudgePrompt(req, 'json').system).not.toContain('Never correct or mention spelling');
    expect(buildJudgePrompt(req, 'json').system).not.toMatch(/\{\{\w+\}\}/);
    // the model flags a speaking answer off_topic: no marks
    const off = parseJudgement(
      { keyPoints: [{ id: 'grammar_vocabulary', band: 2, met: 'partial' }, { id: 'interactive_communication', band: 1, met: 'partial' }, { id: 'global', band: 2, met: 'partial' }], score: 5, languageIssues: [{ text: 'my favorite', fix: 'my favourite' }], feedbackZh: 'x', confidence: 0.9, flags: ['off_topic'] },
      speak,
      'test',
    );
    expect(off).toMatchObject({ score: 0, needsReview: false, languageIssues: [] });
  });
  it('speaking that is only "I don\'t know" scores 0 without a model', () => {
    const none = buildJudgeRequest(sp, q(sp, 'q1'), extended(spKey, 'q1'), JSON.stringify({ t1: "I don't know.", t2: 'Sorry.' }));
    expect(shortCircuit(none)).toMatchObject({ score: 0, model: 'rules', flags: ['off_topic'] });
  });
  it('states the length once (the task already says "Write 25 words or more.")', () => {
    expect(req.question.text.match(/25 words or more/g)).toHaveLength(1);
  });
  it('speaking: a transcript that matches the model answer is not "copied"', () => {
    const speak = buildJudgeRequest(sp, q(sp, 'q1'), extended(spKey, 'q1'), JSON.stringify({ t1: 'My name is Lily.' }));
    const bands = speak.rubric.keyPoints.map((k) => ({ id: k.id, band: 4, met: 'partial' }));
    const j = parseJudgement({ keyPoints: bands, score: 12, languageIssues: [], feedbackZh: '好。', confidence: 0.9, flags: ['copied_text'] }, speak, 'test');
    expect(j.flags).not.toContain('copied_text');
  });
});

describe('speaking', () => {
  const sq = q(sp, 'q1');
  const it0 = sq.interaction.kind === 'speaking' ? sq.interaction : null!;
  it('turns the transcripts into an examiner / candidate exchange', () => {
    const text = speakingTranscript(sq, JSON.stringify({ [it0.turns[0].id]: 'My name is Lily.' }));
    expect(text).toContain(`Examiner: ${it0.turns[0].text}\nCandidate: My name is Lily.`);
    expect(text).toContain('(no answer)');
    expect(speakingTranscript(sq, '{}')).toBe('');
  });
  it('is answered only when every turn has a transcript, and is judged (pending) after grading', () => {
    const all = Object.fromEntries(it0.turns.map((t) => [t.id, 'Yes.']));
    expect(isAnswered(sq, { [it0.turns[0].id]: 'Yes.' })).toBe(false);
    expect(isAnswered(sq, all)).toBe(true);
    const r = gradeItem(sp, spKey, { q1: all });
    expect(r.byQuestion.find((b) => b.q === 'q1')?.scoredBy).toBe('pending');
  });
  it('uses the Cambridge speaking scale', () => {
    const req = buildJudgeRequest(sp, sq, extended(spKey, 'q1'), JSON.stringify({ [it0.turns[0].id]: 'I am Lily.' }));
    expect(req.rubric.type).toBe('cambridge_a2_speaking');
    expect(buildJudgePrompt(req).system).toContain('do NOT assess pronunciation');
  });
});

describe('exam report', () => {
  it('splits Reading & Writing into reading (auto-scored Parts 1–5) and writing (judged Parts 6–7)', () => {
    const r = gradeItem(rw, rwKey, { q1: [String((rwKey.answers.q1 as { correct: string[] }).correct[0])] });
    expect(examReport(rw, r).map((x) => [x.skill, x.raw, x.max, x.pending])).toEqual([
      ['reading', 1, 30, false],
      ['writing', 0, 30, true],
    ]);
  });
  it('writing the judge could not mark (it was down) is not a 0: no scale score, re-judged on reopening', () => {
    const graded = gradeItem(rw, rwKey, { q31: 'Dear Lee, come camping with us on Saturday.', q32: 'One day Tom found a bag.' });
    const down = fallbackToSelf(graded, ['q31', 'q32']);
    const writing = examReport(rw, down)[1];
    expect(writing).toMatchObject({ skill: 'writing', scale: null, pending: false, unjudged: true });
    const attempt = { itemId: rw.id, status: 'submitted', result: down, responses: {}, startedAt: new Date().toISOString() } as unknown as AttemptT;
    const st = examStatus(attempt, 'reading_writing', 60);
    expect(st).toMatchObject({ kind: 'done', unjudged: true });
    // reading keeps its raw mark, writing shows no mark at all (not "0")
    expect(examStatusLabel(st, ((k: string) => k) as never)).toBe('examStatus.skillRaw · examStatus.skillUnjudged');
    const again = retryUnjudged(down)!;
    expect(again.byQuestion.filter((b) => b.q === 'q31' || b.q === 'q32').map((b) => b.scoredBy)).toEqual(['pending', 'pending']);
    expect(retryUnjudged(graded)).toBeNull();
  });
  it('an unanswered judged question is 0 / 还没有作答 without the model', () => {
    expect(isBlankResponse('  ')).toBe(true);
    expect(isBlankResponse(undefined)).toBe(true);
    expect(isBlankResponse({ t1: '', t2: ' ' })).toBe(true);
    expect(isBlankResponse({ t1: 'My name is Lily.' })).toBe(false);
    expect(isBlankResponse('I like it.')).toBe(false);
    const j = emptyJudgement(4);
    expect([j.score, j.maxPoints, j.needsReview, j.flags]).toEqual([0, 4, false, ['empty']]);
    expect(j.feedbackZh).toContain('还没有作答');
  });
});
