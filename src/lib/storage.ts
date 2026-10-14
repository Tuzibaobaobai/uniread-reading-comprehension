/** AttemptStore — v1 keeps attempts in localStorage (ADR-0003). */
import type { AttemptT } from '@schema';

export interface AttemptStore {
  get(itemId: string): AttemptT | null;
  save(attempt: AttemptT): void;
  clear(itemId: string): void;
  /** current question index, a UI convenience kept separately from the attempt record */
  getPosition(itemId: string): number;
  setPosition(itemId: string, index: number): void;
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
  getPosition: (itemId) => read<number>(`pos.${itemId}`) ?? 0,
  setPosition: (itemId, i) => write(`pos.${itemId}`, i),
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
