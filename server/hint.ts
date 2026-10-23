/**
 * POST /api/rc/hint {itemId, questionId, part} → {tiles}
 * 词汇天天练 (#110): the letters of an English answer (or the words of a phrase), shuffled, for the learner to put in
 * order. A part answered with the hint earns half (the client reports it as `hinted` when grading).
 * The tiles come from the private key, so the answer is never in the static content.
 */
import { createHash } from 'node:crypto';
import { isVocabDay } from '../schema/index';
import type { AnswerKeyT, InlineT, QuestionT } from '@schema';
import { allQuestions } from '../src/lib/grading';
import { HttpError, jsonPost, loadItem } from './http';

/** the accepted spelling the tiles are made of, and the printed first letter (already shown) when there is one */
export function hintAnswer(q: QuestionT, key: AnswerKeyT | undefined, part: string): { answer: string; firstLetter?: string } | null {
  const it = q.interaction;
  if (!key) return null;
  if (it.kind === 'wordProfile' && part === 'word' && 'word' in key) return { answer: key.word[0] };
  if (it.kind === 'wordFamily' && 'forms' in key) {
    const m = part.match(/^(f\d+)\.word$/);
    const form = m && key.forms[m[1]];
    return form ? { answer: form.word[0] } : null;
  }
  if (it.kind === 'textEntry' && 'slots' in key && key.slots[part]) {
    const blank = (it.prompt ?? []).find((n): n is Extract<InlineT, { t: 'blank' }> => n.t === 'blank' && n.id === part);
    return { answer: key.slots[part].accept[0], firstLetter: blank?.hint?.firstLetter };
  }
  return null;
}

/** a phrase → its words; a word → its letters (after the printed first letter); shuffled the same way every time */
export function makeTiles(answer: string, firstLetter = '', seed = ''): string[] {
  const rest = firstLetter && answer.toLowerCase().startsWith(firstLetter.toLowerCase()) ? answer.slice(firstLetter.length) : answer;
  const tiles = /\s/.test(rest.trim()) ? rest.trim().split(/\s+/) : [...rest.replace(/\s+/g, '')];
  if (tiles.length < 2) return tiles;
  const rank = (t: string, i: number) => createHash('sha256').update(`${seed}:${i}:${t}`).digest().readUInt32BE(0);
  const order = tiles.map((t, i) => ({ t, r: rank(t, i) })).sort((a, b) => a.r - b.r).map((x) => x.t);
  // never hand back the answer in order
  return order.join('\u0000') === tiles.join('\u0000') ? [...order.slice(1), order[0]] : order;
}

export async function hintCall(body: unknown, root?: string): Promise<{ tiles: string[] }> {
  const { itemId, questionId, part } = (body ?? {}) as { itemId?: unknown; questionId?: unknown; part?: unknown };
  if (typeof questionId !== 'string' || typeof part !== 'string') throw new HttpError(400, 'bad request');
  const { item, key } = await loadItem(itemId, root, true);
  if (!isVocabDay(item)) throw new HttpError(400, 'no hints for this item');
  const q = allQuestions(item).find((x) => x.id === questionId);
  const a = q && hintAnswer(q, key.answers[questionId], part);
  if (!a) throw new HttpError(400, 'no hint for this answer');
  return { tiles: makeTiles(a.answer, a.firstLetter, `${itemId}:${questionId}:${part}`) };
}

export default jsonPost((body) => hintCall(body));
