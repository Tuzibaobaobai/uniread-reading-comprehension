/**
 * POST /api/rc/grade {itemId, responses, hinted?} → {result, key}
 * Objective questions are graded on the server with the pure grader; the key (answers + explanations)
 * is returned only in this response, never published as a static file. docs/06.
 * 词汇天天练 (#110): `hinted` = answer parts solved with hint tiles (half points); Chinese meanings the rules reject get
 * one model check (server/meaning.ts).
 */
import type { ItemKeyT } from '@schema';
import { isVocabDay } from '../schema/index';
import { gradeItem, type ResponseValue } from '../src/lib/grading';
import { HttpError, jsonPost, loadItem } from './http';
import { meaningAsks, meaningFromEnv, type MeaningCheck } from './meaning';

/**
 * the key as the review screen needs it: answers, explanations, evidence, sample answers and key points — without the
 * judge-only material (examiner-scored anchors, key-point wording hints), which the UI never shows (docs/09 §5)
 */
export function publicKey(key: ItemKeyT): ItemKeyT {
  const answers = Object.fromEntries(
    Object.entries(key.answers).map(([id, a]) => {
      if (!('sampleAnswer' in a)) return [id, a];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { anchors, ...rest } = a;
      // a sample answer that is a real candidate's script: its examiner mark and comment are shown with it
      const sample = anchors?.find((x) => x.response.trim() === rest.sampleAnswer.trim());
      const sampleMark = sample ? { score: sample.score, ...(sample.noteZh ? { noteZh: sample.noteZh } : {}) } : undefined;
      return [id, { ...rest, ...(sampleMark ? { sampleMark } : {}), ...(rest.keyPoints ? { keyPoints: rest.keyPoints.map(({ id: kid, descZh, weight }) => ({ id: kid, descZh, weight })) } : {}) }];
    }),
  );
  return { ...key, answers } as ItemKeyT;
}

export async function gradeCall(body: unknown, root?: string, meaning: MeaningCheck | null = null) {
  const { itemId, responses, hinted } = (body ?? {}) as { itemId?: unknown; responses?: unknown; hinted?: unknown };
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) throw new HttpError(400, 'bad responses');
  if (hinted !== undefined && (!Array.isArray(hinted) || hinted.length > 500 || hinted.some((h) => typeof h !== 'string'))) throw new HttpError(400, 'bad hinted');
  const { item, key } = await loadItem(itemId, root, true);
  const r = responses as Record<string, ResponseValue>;
  const opts = { hinted: hinted as string[] | undefined };
  let result = gradeItem(item, key, r, opts);
  if (isVocabDay(item) && meaning) {
    const asks = meaningAsks(item, key, r, result);
    if (asks.length) {
      // one retry: a meaning the model could not look at is never left as the learner's mistake (QA 2026-11-12)
      let zhOk: string[] | null = null;
      for (let i = 0; i < 2 && zhOk === null; i++) {
        try {
          zhOk = await meaning.check(asks);
        } catch (e) {
          console.warn('meaning check failed:', (e as Error).message);
        }
      }
      if (zhOk?.length) result = gradeItem(item, key, r, { ...opts, zhOk });
      // still unavailable: the client grades again later (VocabDayPage) instead of treating these meanings as wrong
      if (zhOk === null) result = { ...result, meaningUnchecked: asks.map((a) => a.id) };
    }
  }
  return { result, key: publicKey(key) };
}

export default jsonPost((body) => gradeCall(body, undefined, meaningFromEnv()));
