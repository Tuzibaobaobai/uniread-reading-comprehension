/**
 * Pure grading functions. No DOM / storage dependencies so the same code can run
 * on a UniRead server where keys/ are kept private.
 */
import type { AnswerKeyT, AttemptT, BlockT, InlineT, ItemKeyT, ItemT, QuestionT } from '@schema';

export type ResponseValue = string[] | Record<string, string> | string;
export type Result = NonNullable<AttemptT['result']>;
export type QuestionResult = Result['byQuestion'][number];

/** lower-case, trim, collapse spaces, unify quotes/dashes, strip trailing punctuation */
export function normalizeText(s: string, caseSensitive = false): string {
  let out = s
    .normalize('NFKC')
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,!?;:。，！？；：]+$/u, '')
    .trim();
  if (!caseSensitive) out = out.toLowerCase();
  return out;
}

/** blank ids answered by a question (inlineChoice: its blankId; gapMatch/textEntry: blankIds or blanks in prompt) */
export function questionBlankIds(q: QuestionT): string[] {
  const it = q.interaction;
  if (it.kind === 'inlineChoice') return [it.blankId];
  if (it.kind === 'extendedText') return it.blankId ? [it.blankId] : [];
  if (it.kind !== 'textEntry' && it.kind !== 'gapMatch') return [];
  if (it.blankIds?.length) return it.blankIds;
  return (it.prompt ?? []).filter((n): n is Extract<InlineT, { t: 'blank' }> => n.t === 'blank').map((n) => n.id);
}

/** every block of an item: article, section stimulus, and (exam items) section / question material */
export function allBlocks(item: ItemT): BlockT[] {
  return [
    ...item.article.blocks,
    ...item.sections.flatMap((s) => [
      ...(s.stimulus ?? []),
      ...(s.material ?? []),
      ...s.questions.flatMap((q) => [...(q.material ?? []), ...(q.interaction.kind === 'extendedText' ? (q.interaction.stimulus ?? []) : [])]),
    ]),
  ];
}

/** first-letter hint lookup so "n" + "ice" and "nice" are both accepted */
export function collectBlankHints(item: ItemT): Map<string, string> {
  const hints = new Map<string, string>();
  const visit = (rich: InlineT[] | undefined) =>
    rich?.forEach((n) => {
      if (n.t === 'blank' && n.hint?.firstLetter) hints.set(n.id, n.hint.firstLetter);
    });
  const visitBlocks = (blocks: BlockT[]) =>
    blocks.forEach((b) => {
      switch (b.type) {
        case 'paragraph':
        case 'heading':
          visit(b.content);
          break;
        case 'list':
          b.items.forEach(visit);
          break;
        case 'dialogue':
          b.turns.forEach((t) => visit(t.content));
          break;
        case 'note':
          visit(b.title);
          visit(b.heading);
          b.header?.forEach(visit);
          b.content.forEach(visit);
          b.signature?.forEach(visit);
          break;
        case 'table':
          visit(b.caption);
          b.rows.forEach((r) => r.forEach((c) => visit(c.content)));
          break;
      }
    });
  visitBlocks(allBlocks(item));
  item.sections.forEach((s) => {
    s.questions.forEach((q) => {
      const it = q.interaction;
      if ('prompt' in it) visit(it.prompt);
    });
  });
  return hints;
}

function slotCorrect(given: string | undefined, accept: string[], caseSensitive: boolean, firstLetter?: string) {
  if (!given || !given.trim()) return false;
  const g = normalizeText(given, caseSensitive);
  return accept.some((a) => {
    const target = normalizeText(a, caseSensitive);
    if (g === target) return true;
    // student typed only the remainder after a printed first letter
    if (firstLetter) {
      const prefix = normalizeText(firstLetter, caseSensitive);
      if (target.startsWith(prefix) && normalizeText(prefix + given, caseSensitive) === target) return true;
    }
    return false;
  });
}

export function gradeQuestion(
  q: QuestionT,
  key: AnswerKeyT | undefined,
  response: ResponseValue | undefined,
  hints: Map<string, string>,
): QuestionResult {
  const maxPoints = q.points ?? 1;
  const base = { q: q.id, maxPoints };
  if (!key) return { ...base, correct: null, points: 0 };

  if ('correct' in key && q.interaction.kind === 'gapMatch') {
    const given = response && typeof response === 'object' && !Array.isArray(response) ? response : {};
    const parts: Record<string, boolean> = {};
    questionBlankIds(q).forEach((b, i) => (parts[b] = given[b] === key.correct[i]));
    const n = Object.keys(parts).length;
    const right = Object.values(parts).filter(Boolean).length;
    return { ...base, correct: right === n, points: n ? (maxPoints * right) / n : 0, parts };
  }

  if ('correct' in key) {
    const given = Array.isArray(response) ? response : [];
    const ok = given.length === key.correct.length && key.correct.every((c) => given.includes(c));
    return { ...base, correct: ok, points: ok ? maxPoints : 0 };
  }

  if ('slots' in key) {
    const given = response && typeof response === 'object' && !Array.isArray(response) ? response : {};
    const parts: Record<string, boolean> = {};
    for (const [blankId, slot] of Object.entries(key.slots)) {
      parts[blankId] = slotCorrect(given[blankId], slot.accept, !!slot.caseSensitive, hints.get(blankId));
    }
    const n = Object.keys(parts).length;
    const right = Object.values(parts).filter(Boolean).length;
    const all = q.interaction.kind === 'textEntry' && q.interaction.scoring === 'all';
    const points = all ? (right === n ? maxPoints : 0) : n ? (maxPoints * right) / n : 0;
    return { ...base, correct: right === n, points, parts };
  }

  if ('pairs' in key) {
    const given = response && typeof response === 'object' && !Array.isArray(response) ? response : {};
    const parts: Record<string, boolean> = {};
    for (const [left, right] of Object.entries(key.pairs)) parts[left] = given[left] === right;
    const n = Object.keys(parts).length;
    const right = Object.values(parts).filter(Boolean).length;
    return { ...base, correct: right === n, points: n ? (maxPoints * right) / n : 0, parts };
  }

  if ('sequence' in key || 'sequences' in key) {
    const given = Array.isArray(response) ? response : [];
    const accepted = 'sequence' in key ? [key.sequence] : key.sequences;
    const ok = accepted.some((seq) => given.length === seq.length && seq.every((id, i) => given[i] === id));
    return { ...base, correct: ok, points: ok ? maxPoints : 0 };
  }

  // extendedText / speaking: scored later by the LLM judge (docs/09), by the learner, or not at all
  const it = q.interaction;
  const scoring = it.kind === 'extendedText' || it.kind === 'speaking' ? it.scoring : 'none';
  return { ...base, correct: null, points: 0, scoredBy: scoring === 'judge' ? 'pending' : scoring === 'self' ? 'self' : 'none' };
}

export function allQuestions(item: ItemT): QuestionT[] {
  return item.sections.flatMap((s) => s.questions);
}

/** questions graded deterministically (constructed responses are excluded) */
export function isScored(q: QuestionT): boolean {
  return q.interaction.kind !== 'extendedText' && q.interaction.kind !== 'speaking';
}

/** a question counts toward score/maxScore once its points are decided by rules or by the judge */
const counts = (r: QuestionResult) => r.scoredBy === undefined || r.scoredBy === 'auto' || r.scoredBy === 'judge';

/** recompute score / maxScore from byQuestion (used after judgements arrive) */
export function totals(byQuestion: QuestionResult[]): Pick<Result, 'score' | 'maxScore'> {
  const scored = byQuestion.filter(counts);
  const score = scored.reduce((s, r) => s + r.points, 0);
  return { score: Math.round(score * 100) / 100, maxScore: scored.reduce((s, r) => s + r.maxPoints, 0) };
}

/**
 * questions that count in a section where the learner answers `choose` of them (PET Writing Part 2: 1 of 2):
 * the answered ones, else the first ones
 */
export function chosenQuestions(section: ItemT['sections'][number], responses: Record<string, ResponseValue>): QuestionT[] {
  if (!section.choose) return section.questions;
  const answered = section.questions.filter((q) => isAnswered(q, responses[q.id]));
  return (answered.length ? answered : section.questions).slice(0, section.choose);
}

export function gradeItem(item: ItemT, key: ItemKeyT, responses: Record<string, ResponseValue>): Result {
  const hints = collectBlankHints(item);
  const counted = new Set(item.sections.flatMap((s) => chosenQuestions(s, responses)).map((q) => q.id));
  const byQuestion = allQuestions(item).map((q) =>
    counted.has(q.id)
      ? gradeQuestion(q, key.answers[q.id], responses[q.id], hints)
      : // not chosen: shown as such, never counted
        { q: q.id, correct: null, points: 0, maxPoints: q.points ?? 1, scoredBy: 'none' as const },
  );
  return { ...totals(byQuestion), byQuestion };
}

/** is a question answered enough to count as "done" in the navigator */
export function isAnswered(q: QuestionT, response: ResponseValue | undefined): boolean {
  if (response === undefined) return false;
  const it = q.interaction;
  switch (it.kind) {
    case 'choice':
    case 'inlineChoice':
      return Array.isArray(response) && response.length > 0;
    case 'order':
      return Array.isArray(response) && response.length === it.items.length;
    case 'gapMatch':
    case 'textEntry': {
      const ids = questionBlankIds(q);
      const r = response as Record<string, string>;
      return ids.length > 0 && ids.every((id) => (r[id] ?? '').trim() !== '');
    }
    case 'match': {
      const r = response as Record<string, string>;
      return it.left.every((l) => !!r[l.id]);
    }
    case 'extendedText':
      return typeof response === 'string' && response.trim() !== '';
    case 'speaking': {
      // every turn has a (transcribed) recording
      const r = response as Record<string, string>;
      return typeof r === 'object' && !Array.isArray(r) && it.turns.every((t) => (r[t.id] ?? '') !== '');
    }
  }
}
