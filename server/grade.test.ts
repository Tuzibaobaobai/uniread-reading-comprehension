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
  it('rejects bad input', async () => {
    await expect(gradeCall({ itemId: '../../etc/passwd', responses: {} }, root)).rejects.toMatchObject({ status: 400 });
    await expect(gradeCall({ itemId: 'ci-g7-w01-mon' }, root)).rejects.toMatchObject({ status: 400 });
    await expect(gradeCall({ itemId: 'ci-g7-w09-mon', responses: {} }, root)).rejects.toMatchObject({ status: 404 });
  });
});
