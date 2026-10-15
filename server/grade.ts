/**
 * POST /api/rc/grade {itemId, responses} → {result, key}
 * Objective questions are graded on the server with the pure grader; the key (answers + explanations)
 * is returned only in this response, never published as a static file. docs/06.
 */
import { gradeItem, type ResponseValue } from '../src/lib/grading';
import { HttpError, jsonPost, loadItem } from './http';

export async function gradeCall(body: unknown, root?: string) {
  const { itemId, responses } = (body ?? {}) as { itemId?: unknown; responses?: unknown };
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) throw new HttpError(400, 'bad responses');
  const { item, key } = await loadItem(itemId, root);
  return { result: gradeItem(item, key, responses as Record<string, ResponseValue>), key };
}

export default jsonPost((body) => gradeCall(body));
