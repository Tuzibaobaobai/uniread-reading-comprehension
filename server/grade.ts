/**
 * POST /api/rc/grade {itemId, responses, hinted?} → {result, key}
 * Objective questions are graded on the server with the pure grader; the key (answers + explanations)
 * is returned only in this response, never published as a static file. docs/06.
 * 词汇天天练 (#110): `hinted` = answer parts solved with hint tiles (half points); Chinese meanings the rules reject get
 * one model check (server/meaning.ts).
 */
import { isVocabDay } from '../schema/index';
import { gradeItem, type ResponseValue } from '../src/lib/grading';
import { HttpError, jsonPost, loadItem } from './http';
import { meaningAsks, meaningFromEnv, type MeaningCheck } from './meaning';

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
      try {
        const zhOk = await meaning.check(asks);
        if (zhOk.length) result = gradeItem(item, key, r, { ...opts, zhOk });
      } catch (e) {
        console.warn('meaning check skipped:', (e as Error).message);
      }
    }
  }
  return { result, key };
}

export default jsonPost((body) => gradeCall(body, undefined, meaningFromEnv()));
