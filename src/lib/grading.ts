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
  if (it.kind === 'extendedText') return it.blankId ? [it.blankId] : [];
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

/** a placeholder in a printed phrase: sb. / sth. (a person / a thing) or a generic … */
const GENERIC = '…';
const PLACEHOLDER = new Set(['sb', 'sth', GENERIC]);
/** a learner's capital A / B: a placeholder (add A to B) or just the word in capitals (GIVE SB A SOUND BOX) */
const CAP_A = '\u0001a';
const CAP_B = '\u0001b';

/**
 * 词汇天天练 phrase notation as tokens: sb./sth. with or without the dot, ... / … with any spacing, A / B as placeholders
 * (prefer A to B), spaces around ( ) / and commas or semicolons ignored (laid, laid,laying · the former …, the latter …),
 * a possessive 's as its own token (sb.'s = …'s). The words themselves are compared exactly.
 * In a key, somebody / someone / something are words (a spelling answer); in a learner's answer they may also fill a
 * sb. / sth. placeholder of the key (see phraseMatches).
 */
export function phraseTokens(s: string, role: 'key' | 'given' = 'key'): string[] {
  const t = s
    .normalize('NFKC')
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/[；]/g, ';')
    .replace(/[，、]/g, ',')
    .replace(/\.{2,}/g, ` ${GENERIC} `)
    // capital A / B as placeholders (not a sentence-initial article "A …")
    .replace(/(?<=\S\s+)A(?=\s|$|')|(?<![\w'])B(?![\w'])/g, (m) => (role === 'key' ? ` ${GENERIC} ` : ` ${m === 'A' ? CAP_A : CAP_B} `))
    .toLowerCase()
    .replace(/\b(sb|sth)\./g, '$1')
    .replace(/(\S)'s\b/g, "$1 's")
    .replace(/([()/])/g, ' $1 ')
    .replace(/[,;]/g, ' ')
    .replace(/[.!?:。！？：]+\s*$/u, '');
  return t.split(/\s+/).filter(Boolean);
}

/** words after which a printed pattern may leave its object out (keep … from, share … with) */
const PREPOSITION = new Set(['about', 'after', 'against', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'off', 'on', 'onto', 'over', 'to', 'towards', 'with', 'without']);

/** a learner's token that can stand for a placeholder of the key */
const fillsPerson = (x: string) => x === 'sb' || x === 'somebody' || x === 'someone' || x === GENERIC || x === CAP_A || x === CAP_B;
const fillsThing = (x: string) => x === 'sth' || x === 'something' || x === GENERIC || x === CAP_A || x === CAP_B;
const fillsAny = (x: string) => fillsPerson(x) || fillsThing(x);
/** a learner's token that matches a word of the key: capital A / B may simply be the word a / b */
const sameWord = (g: string, t: string) => g === t || (g === CAP_A && t === 'a') || (g === CAP_B && t === 'b');

/**
 * does a learner's phrase match a printed one? Notation as in phraseTokens. Every placeholder is part of the pattern
 * being learnt and must be written (so … that ≠ so that, add A to B ≠ add to), but in any notation: a generic … in the
 * key may be filled with sb. / sth. / A (keep sb. from = keep … from), and sb. / sth. may be written as … or written out.
 * A pattern key that ends in a preposition may be completed with its object (keep … from doing sth., share … with sb.);
 * nothing else may be added (agree with sb. ≠ agree with sb. sth., in sb.'s adult life ≠ … life sth.).
 */
export function phraseMatches(given: string, target: string): boolean {
  const g = phraseTokens(given, 'given');
  const t = phraseTokens(target, 'key');
  const pattern = t.some((x) => PLACEHOLDER.has(x));
  const tail = (rest: string[]) =>
    rest.length === 0 ||
    (pattern && PREPOSITION.has(t[t.length - 1]) && (rest.length === 1 ? fillsAny(rest[0]) || rest[0] === 'doing' : rest.length === 2 && rest[0] === 'doing' && fillsAny(rest[1])));
  const memo = new Map<string, boolean>();
  const go = (i: number, j: number): boolean => {
    const k = `${i},${j}`;
    const hit = memo.get(k);
    if (hit !== undefined) return hit;
    let ok: boolean;
    if (i === t.length) ok = tail(g.slice(j));
    else if (j >= g.length) ok = false;
    else if (t[i] === GENERIC) ok = fillsAny(g[j]) && go(i + 1, j + 1);
    else if (t[i] === 'sb') ok = fillsPerson(g[j]) && go(i + 1, j + 1);
    else if (t[i] === 'sth') ok = fillsThing(g[j]) && go(i + 1, j + 1);
    else ok = sameWord(g[j], t[i]) && go(i + 1, j + 1);
    memo.set(k, ok);
    return ok;
  };
  return go(0, 0);
}

/**
 * KET / PET gap-fills: notation an examiner ignores in times and prices — 7.45pm = 7.45 pm = 7.45 p.m., £ 6.30 = £6.30,
 * quarter to 8 = quarter to eight. Words and numbers themselves still have to be right.
 */
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export function examNotation(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s*([ap])\.?\s?m\b\.?/gi, '$1 $2m')
    .replace(/([£$€¥])\s+(?=\d)/g, '$1')
    .replace(/\b(quarter (?:to|past)|half past) (\d{1,2})\b/gi, (m, a: string, n: string) => (Number(n) <= 12 ? `${a} ${NUMBER_WORDS[Number(n)]}` : m));
}

type MatchMode = 'plain' | 'phrase' | 'exam';

function slotCorrect(given: string | undefined, accept: string[], caseSensitive: boolean, firstLetter?: string, mode: MatchMode = 'plain') {
  if (!given || !given.trim()) return false;
  const norm = (x: string) => normalizeText(mode === 'exam' ? examNotation(x) : x, caseSensitive);
  const g = norm(given);
  return accept.some((a) => {
    const target = norm(a);
    if (g === target) return true;
    if (mode === 'phrase' && phraseMatches(given, a)) return true;
    // student typed only the remainder after a printed first letter
    if (firstLetter) {
      const prefix = normalizeText(firstLetter, caseSensitive);
      if (target.startsWith(prefix) && norm(prefix + given) === target) return true;
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
  // the bracket may replace the character before it (到（在） = 在), but never swallow a negation (不（使人）舒服 ≠ 使人舒服)
  const replaces = replaced.length >= 2 && !NEGATION.test(before.slice(-1));
  return [`${before}${after}`, `${before}${m[1]}${after}`, ...(replaces ? [replaced] : [])].flatMap(bracketVariants);
}

/** Chinese meaning: split into senses and compare without punctuation, brackets, 的 or ellipses */
const zhParts = (s: string) =>
  s
    .normalize('NFKC')
    // a bracket is one note: its own 、 or 或 (信件、邮包等 · 或物) do not split the sense into pieces
    .replace(/[（(][^）)]*[）)]/g, (m) => m.replace(/[；;，,、/｜|\s]+|或/g, ''))
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
  return zhParts(given).some((g) => want.some((w) => g === w || (Math.min(g.length, w.length) >= 2 && (contains(g, w) || contains(w, g)))));
}

/** characters that turn a meaning into its opposite: 可能 ⊂ 不可能, 诚实 ⊂ 不诚实, 生命 ⊂ 无生命 */
const NEGATION = /[不无非未没否莫勿]/;
/** the longer meaning contains the shorter one, and what it adds does not negate it */
function contains(longer: string, shorter: string): boolean {
  const at = longer.indexOf(shorter);
  if (at < 0) return false;
  return !NEGATION.test(longer.slice(0, at) + longer.slice(at + shorter.length));
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
  /** 词汇天天练: phrase notation is not graded (phraseMatches); KET / PET: time and price notation (examNotation) */
  mode: MatchMode = 'plain',
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
      word: slotCorrect(record.word, key.word, false, undefined, mode),
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
      const match = same.find((id) => !used.has(id) && key.forms[id] && slotCorrect(word, key.forms[id].word, false, undefined, mode));
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
    // one pick (choice / inlineChoice): several listed ids are alternatives — any of them is right (#127: ☹ or 😐)
    const single = q.interaction.kind === 'choice' || q.interaction.kind === 'inlineChoice';
    const ok = single ? given.length === 1 && key.correct.includes(given[0]) : given.length === key.correct.length && key.correct.every((c) => given.includes(c));
    return { ...base, correct: ok, points: ok ? maxPoints : 0 };
  }

  if ('slots' in key) {
    const given = record;
    const parts: Record<string, boolean> = {};
    for (const [blankId, slot] of Object.entries(key.slots)) {
      parts[blankId] = slotCorrect(given[blankId], slot.accept, !!slot.caseSensitive, hints.get(blankId), mode);
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
  // fractional points (e.g. 0.2 per vocab answer part) add up to 79.99999…: round both like the score
  return { score: Math.round(score * 100) / 100, maxScore: Math.round(scored.reduce((s, r) => s + r.maxPoints, 0) * 100) / 100 };
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
  const mode: MatchMode = 'entryIds' in item ? 'phrase' : 'format' in item && item.format === 'exam' ? 'exam' : 'plain';
  const byQuestion = allQuestions(item).map((q) =>
    counted.has(q.id)
      ? gradeQuestion(q, key.answers[q.id], responses[q.id], hints, hinted, zhOk, mode)
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
