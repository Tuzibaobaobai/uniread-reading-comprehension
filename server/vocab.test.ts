import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { hintCall, makeTiles } from './hint';
import { voiceAllowed } from './transcribe';
import { meaningAsks } from './meaning';
import { gradeCall } from './grade';
import { loadItem } from './http';

const root = join(process.cwd(), 'content');

describe('hint tiles', () => {
  it('shuffles the letters of a word, the words of a phrase, the same way every time, never in order', () => {
    const t = makeTiles('accident', '', 's');
    expect([...t].sort().join('')).toBe([...'accident'].sort().join(''));
    expect(t.join('')).not.toBe('accident');
    expect(makeTiles('accident', '', 's')).toEqual(t);
    expect(makeTiles('in the end', '', 's').sort()).toEqual(['end', 'in', 'the']);
    expect(makeTiles('advice', 'a', 's').sort().join('')).toBe('cdeiv'); // the printed first letter is not a tile
  });
  it('comes from the key, only for English answers of a vocab day', async () => {
    const { tiles } = await hintCall({ itemId: 'zkv-d01', questionId: 'q1', part: 'word' }, root);
    expect(tiles.sort().join('')).toBe('accdeint');
    await expect(hintCall({ itemId: 'zkv-d01', questionId: 'q1', part: 'zh' }, root)).rejects.toMatchObject({ status: 400 });
    await expect(hintCall({ itemId: 'ci-g7-w01-mon', questionId: 'q1', part: 'b1' }, root)).rejects.toMatchObject({ status: 400 });
  });
});

describe('voice input', () => {
  it('only for Chinese meanings and translations', async () => {
    const { item } = await loadItem('zkv-d01', root, true);
    const q = (id: string) => item.sections.flatMap((s) => s.questions).find((x) => x.id === id)!;
    expect(voiceAllowed(q('q1'), 'zh')).toBe(true);
    expect(voiceAllowed(q('q1'), 'word')).toBe(false);
    expect(voiceAllowed(q('q21'), 'f1.zh')).toBe(true);
    expect(voiceAllowed(q('q6'), 'b6')).toBe(false);
    expect(voiceAllowed(q('q36'), 'text')).toBe(true);
  });
});

describe('grading a vocab day', () => {
  it('hinted parts score half; a wrong meaning is checked once by the model and accepted when it says so', async () => {
    const asked: string[] = [];
    const meaning = { model: 'stub', check: async (asks: { id: string }[]) => (asks.forEach((a) => asked.push(a.id)), ['q1:zh']) };
    const { result } = await gradeCall(
      { itemId: 'zkv-d01', responses: { q1: { word: 'accident', pos: 'n.', zh: '车祸' } }, hinted: ['q1:word'] },
      root,
      meaning,
    );
    expect(asked).toEqual(['q1:zh']);
    expect(result.byQuestion[0].points).toBeCloseTo((2 * 2.5) / 3);
    await expect(gradeCall({ itemId: 'zkv-d01', responses: {}, hinted: 'q1:word' }, root)).rejects.toMatchObject({ status: 400 });
  });
  it('asks only about meanings that were written and missed', async () => {
    const { item, key } = await loadItem('zkv-d01', root, true);
    if (!('format' in item)) throw new Error('not a vocab day');
    const responses = { q1: { word: 'accident', pos: 'n.', zh: '' }, q2: { word: 'abroad', pos: 'adv.', zh: '在国外' } };
    const { result } = await gradeCall({ itemId: 'zkv-d01', responses }, root);
    expect(meaningAsks(item as never, key, responses, result)).toEqual([]);
  });
});
