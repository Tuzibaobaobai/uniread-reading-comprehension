import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ExamItemT, ItemKeyT } from '@schema';
import { allQuestions, gradeItem, isAnswered } from './grading';
import { CAMBRIDGE_PROMPT_VERSION, buildJudgePrompt, buildJudgeRequest, parseJudgement, speakingTranscript } from './judge';
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
  it('splits Reading & Writing into reading (Parts 1–5) and writing (Parts 6–7)', () => {
    const r = gradeItem(rw, rwKey, { q1: [String((rwKey.answers.q1 as { correct: string[] }).correct[0])] });
    const rows = examReport(rw, r);
    expect(rows.map((x) => [x.skill, x.max])).toEqual([
      ['reading', 30],
      ['writing', 30],
    ]);
    expect(rows[0].raw).toBe(1);
    expect(rows[1].pending).toBe(true);
  });
});
