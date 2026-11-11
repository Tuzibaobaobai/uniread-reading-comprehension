import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { gradeCall } from './grade';

const root = join(process.cwd(), 'content');

describe('POST /api/rc/grade', () => {
  it('grades on the server and returns the key only with the result', async () => {
    const { result, key } = await gradeCall({ itemId: 'ci-g7-w01-mon', responses: { q1: ['C'], q2: ['A'] } }, root);
    expect(result).toMatchObject({ score: 1, maxScore: 3 });
    expect(key.answers.q1).toMatchObject({ correct: ['C'] });
  });
  it('keeps the judge-only material (examiner-scored anchors, key-point hints) on the server', async () => {
    const { key } = await gradeCall({ itemId: 'ket1-t2-rw', responses: {} }, root);
    const json = JSON.stringify(key);
    expect(json).not.toContain('"anchors"');
    expect(json).not.toContain('"examples"');
    const q31 = key.answers.q31 as { sampleAnswer: string; keyPoints?: { id: string; descZh: string; weight: number }[] };
    expect(q31.sampleAnswer).toBeTruthy();
    expect(q31.keyPoints?.map((k) => k.id)).toEqual(['content', 'organisation', 'language']);
  });
  it('marks a sample answer that is a real candidate script with its examiner mark and comment', async () => {
    const { key } = await gradeCall({ itemId: 'pet1-t1-w', responses: {} }, root);
    const q1 = key.answers.q1 as { sampleMark?: { score: number; noteZh?: string } };
    expect(q1.sampleMark?.score).toBe(18);
    expect(q1.sampleMark?.noteZh).toMatch(/competicion/);
  });
  it('rejects bad input', async () => {
    await expect(gradeCall({ itemId: '../../etc/passwd', responses: {} }, root)).rejects.toMatchObject({ status: 400 });
    await expect(gradeCall({ itemId: 'ci-g7-w01-mon' }, root)).rejects.toMatchObject({ status: 400 });
    await expect(gradeCall({ itemId: 'ci-g7-w19-mon', responses: {} }, root)).rejects.toMatchObject({ status: 404 });
  });
});
