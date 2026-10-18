/** AttemptStore — v1 keeps attempts in localStorage (ADR-0003). */
import type { AttemptT } from '@schema';

export interface AttemptStore {
  get(itemId: string): AttemptT | null;
  save(attempt: AttemptT): void;
  clear(itemId: string): void;
  /**
   * last viewed question id — kept separately from the attempt record so an unanswered question
   * can be the resume point (docs/14 §7: position is not inferred from the last answered question)
   */
  getPosition(itemId: string): string | null;
  setPosition(itemId: string, questionId: string): void;
}

const PREFIX = 'uniread.rc.';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — keep working in memory */
  }
}

export const localAttempts: AttemptStore = {
  get: (itemId) => read<AttemptT>(`attempt.${itemId}`),
  save: (a) => write(`attempt.${a.itemId}`, a),
  clear: (itemId) => {
    write(`attempt.${itemId}`, null);
    write(`pos.${itemId}`, null);
  },
  getPosition: (itemId) => {
    const v = read<string | number>(`pos.${itemId}`);
    return typeof v === 'string' ? v : null; // older builds stored an index — ignore it
  },
  setPosition: (itemId, questionId) => write(`pos.${itemId}`, questionId),
};

export function newAttempt(itemId: string, itemVersion: string): AttemptT {
  return {
    attemptId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    itemId,
    itemVersion,
    learnerId: null,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    durationSec: 0,
    status: 'in_progress',
    responses: {},
    result: null,
  };
}

/** remove every saved attempt and position (development helper: /#/reset) */
export function clearAllLocal(): number {
  let n = 0;
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => {
        localStorage.removeItem(k);
        n++;
      });
  } catch {
    /* storage unavailable */
  }
  return n;
}
