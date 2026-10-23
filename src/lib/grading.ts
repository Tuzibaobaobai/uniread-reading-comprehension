/**
 * Pure grading functions. No DOM / storage dependencies so the same code can run
 * on a UniRead server where keys/ are kept private.
 */
import type { AnswerKeyT, AttemptT, BlockT, InlineT, ItemKeyT, ItemT, QuestionT, VocabDayItemT } from '@schema';

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
  if (it.kind !== 'textEntry' && it.kind !== 'gapMatch') return [];
  if (it.blankIds?.length) return it.blankIds;
  return (it.prompt ?? []).filter((n): n is Extract<InlineT, { t: 'blank' }> => n.t === 'blank').map((n) => n.id);
}

/** every block of an item: article, section stimulus, and (exam items) section / question material */
export function allBlocks(item: ItemT | VocabDayItemT): BlockT[] {
  return [
    ...('article' in item ? item.article.blocks : []),
    ...item.sections.flatMap((s) => [
      ...(s.stimulus ?? []),
      ...(s.material ?? []),
      ...s.questions.flatMap((q) => [...(q.material ?? []), ...(q.interaction.kind === 'extendedText' ? (q.interaction.stimulus ?? []) : [])]),
    ]),
  ];
}

/** first-letter hint lookup so "n" + "ice" and "nice" are both accepted */
export function collectBlankHints(item: ItemT | VocabDayItemT): Map<string, string> {
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

/**
 * a bracket in a printed meaning is an optional or alternative wording: 到（在）国外 = 到国外 / 在国外 / 到在国外,
 * 能（够） = 能 / 能够
 */
function bracketVariants(s: string): string[] {
  const m = /[（(]([^）)]*)[）)]/.exec(s);
  if (!m) return [s];
  const before = s.slice(0, m.index);
  const after = s.slice(m.index + m[0].length);
  const replaced = `${before.slice(0, -1)}${m[1]}${after}`;
  return [`${before}${after}`, `${before}${m[1]}${after}`, ...(replaced.length >= 2 ? [replaced] : [])].flatMap(bracketVariants);
}

/** Chinese meaning: split into senses and compare without punctuation, brackets, 的 or ellipses */
const zhParts = (s: string) =>
  s
    .normalize('NFKC')
    .split(/[；;，,、/｜|\s]+|或/)
    .flatMap(bracketVariants)
    .map((p) => p.replace(/[（(][^）)]*[）)]|[.。…·~～"“”'‘’]|的/g, '').trim())
    .filter(Boolean);

/**
 * 词汇天天练 (#110): a Chinese meaning is right when any sense the learner wrote matches any accepted sense — equal, or one
 * contains the other (至少两个字). Answers this misses go to the meaning judge on the server.
 */
export function zhMatches(given: string | undefined, accept: string[]): boolean {
  if (!given?.trim()) return false;
  const want = accept.flatMap(zhParts);
  return zhParts(given).some((g) => want.some((w) => g === w || (Math.min(g.length, w.length) >= 2 && (g.includes(w) || w.includes(g)))));
}

/** a correct part answered with the hint earns half (#110, option A) */
const partValue = (ok: boolean, hinted: boolean) => (ok ? (hinted ? 0.5 : 1) : 0);

export function gradeQuestion(
  q: QuestionT,
  key: AnswerKeyT | undefined,
  response: ResponseValue | undefined,
  hints: Map<string, string>,
  /** answer parts solved with the hint, as "<questionId>:<part>" */
  hinted: Set<string> = new Set(),
  /** Chinese meanings the server's meaning check accepted although zhMatches did not, as "<questionId>:<part>" */
  zhOk: Set<string> = new Set(),
): QuestionResult {
  const maxPoints = q.points ?? 1;
  const base = { q: q.id, maxPoints };
  if (!key) return { ...base, correct: null, points: 0 };
  const h = (part: string) => hinted.has(`${q.id}:${part}`);
  const zh = (part: string, given: string | undefined, accept: string[]) => zhMatches(given, accept) || (!!given?.trim() && zhOk.has(`${q.id}:${part}`));
  const record = response && typeof response === 'object' && !Array.isArray(response) ? response : {};

  if ('word' in key && 'pos' in key) {
    // wordProfile: word, part of speech and Chinese meaning count a third each
    const parts = {
      word: slotCorrect(record.word, key.word, false),
      pos: !!record.pos && key.pos.includes(record.pos),
      zh: zh('zh', record.zh, key.zh),
    };
    const value = partValue(parts.word, h('word')) + partValue(parts.pos, false) + partValue(parts.zh, false);
    return { ...base, correct: parts.word && parts.pos && parts.zh, points: (maxPoints * value) / 3, parts };
  }

  if ('forms' in key) {
    // wordFamily: each slot = word + meaning; slots printed with the same part of speech may be answered in any order
    const it = q.interaction.kind === 'wordFamily' ? q.interaction : null;
    const parts: Record<string, boolean> = {};
    let value = 0;
    const used = new Set<string>();
    for (const slot of it?.slots ?? []) {
      const word = record[`${slot.id}.word`];
      const meaning = record[`${slot.id}.zh`];
      const same = (it?.slots ?? []).filter((s) => s.pos === slot.pos).map((s) => s.id);
      const match = same.find((id) => !used.has(id) && key.forms[id] && slotCorrect(word, key.forms[id].word, false));
      if (match) used.add(match);
      parts[`${slot.id}.word`] = !!match;
      parts[`${slot.id}.zh`] = !!match && zh(`${slot.id}.zh`, meaning, key.forms[match].zh);
      value += partValue(parts[`${slot.id}.word`], h(`${slot.id}.word`)) + partValue(parts[`${slot.id}.zh`], false);
    }
    const n = Object.keys(parts).length;
    return { ...base, correct: n > 0 && Object.values(parts).every(Boolean), points: n ? (maxPoints * value) / n : 0, parts };
  }

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
    const given = record;
    const parts: Record<string, boolean> = {};
    for (const [blankId, slot] of Object.entries(key.slots)) {
      parts[blankId] = slotCorrect(given[blankId], slot.accept, !!slot.caseSensitive, hints.get(blankId));
    }
    const n = Object.keys(parts).length;
    const right = Object.values(parts).filter(Boolean).length;
    const value = Object.entries(parts).reduce((v, [b, ok]) => v + partValue(ok, h(b)), 0);
    const all = q.interaction.kind === 'textEntry' && q.interaction.scoring === 'all';
    const points = all ? (right === n ? (maxPoints * value) / n : 0) : n ? (maxPoints * value) / n : 0;
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

export function allQuestions(item: ItemT | VocabDayItemT): QuestionT[] {
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

export function gradeItem(
  item: ItemT | VocabDayItemT,
  key: ItemKeyT,
  responses: Record<string, ResponseValue>,
  opts: { hinted?: string[]; zhOk?: string[] } = {},
): Result {
  const hints = collectBlankHints(item);
  const hinted = new Set(opts.hinted ?? []);
  const zhOk = new Set(opts.zhOk ?? []);
  const counted = new Set(item.sections.flatMap((s) => chosenQuestions(s, responses)).map((q) => q.id));
  const byQuestion = allQuestions(item).map((q) =>
    counted.has(q.id)
      ? gradeQuestion(q, key.answers[q.id], responses[q.id], hints, hinted, zhOk)
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
    case 'wordProfile': {
      const r = response as Record<string, string>;
      return ['word', 'pos', 'zh'].every((k) => (r[k] ?? '').trim() !== '');
    }
    case 'wordFamily': {
      const r = response as Record<string, string>;
      return it.slots.every((s) => (r[`${s.id}.word`] ?? '').trim() !== '' && (r[`${s.id}.zh`] ?? '').trim() !== '');
    }
  }
}
