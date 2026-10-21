/** Derived lookups for the reader: blank ownership, blank display text, context sentences. */
import type { BlockT, InlineT, ItemKeyT, ItemT, QuestionT, SectionT } from '@schema';
import { allBlocks, isAnswered, questionBlankIds, type ResponseValue, type Result } from '@/lib/grading';
import { plainText } from '@/components/Rich';

export type Responses = Record<string, ResponseValue>;

export interface FlatQuestion {
  q: QuestionT;
  section: SectionT;
  index: number;
  /** first question of its section — show the section instruction prominently */
  firstInSection: boolean;
  /** number on the page / pager: the question number, or the page number for a speaking turn */
  display: number;
  /** speaking: one page per examiner question (GitHub #74) — index into interaction.turns */
  turn?: number;
  /** a section where the learner answers one of several tasks (PET Writing Part 2): one page for all of them */
  choose?: true;
  /** an exam Part answered on one page (section.view all / match, #82 #86 #87): q = its first question */
  group?: true;
  /** last question number on a group page (pager shows first–last) */
  displayTo?: number;
}

/**
 * one entry per page. A speaking question (one Part, scored as a whole) gets a page per examiner question,
 * numbered on from the pages before it.
 */
export function flatten(item: ItemT): FlatQuestion[] {
  const out: FlatQuestion[] = [];
  item.sections.forEach((section) => {
    if (section.view) {
      const q = section.questions[0];
      const last = section.questions[section.questions.length - 1];
      out.push({ q, section, index: out.length, firstInSection: true, display: q.number, displayTo: last.number, group: true });
      return;
    }
    if (section.choose === 1) {
      const q = section.questions[0];
      out.push({ q, section, index: out.length, firstInSection: true, display: q.number, choose: true });
      return;
    }
    section.questions.forEach((q, i) => {
      const it = q.interaction;
      if (it.kind === 'speaking')
        it.turns.forEach((_, turn) =>
          out.push({ q, section, index: out.length, firstInSection: i === 0 && turn === 0, display: out.length + 1, turn }),
        );
      else out.push({ q, section, index: out.length, firstInSection: i === 0, display: q.number });
    });
  });
  return out;
}

/** is this page answered: the question, or for a speaking page its own turn */
export function pageAnswered(f: FlatQuestion, responses: Responses): boolean {
  if (f.choose) return f.section.questions.some((q) => isAnswered(q, responses[q.id]));
  if (f.group) return f.section.questions.every((q) => isAnswered(q, responses[q.id]));
  const it = f.q.interaction;
  if (it.kind === 'speaking' && f.turn !== undefined) {
    const r = responses[f.q.id];
    return !!r && typeof r === 'object' && !Array.isArray(r) && !!(r as Record<string, string>)[it.turns[f.turn].id];
  }
  return isAnswered(f.q, responses[f.q.id]);
}

/** blankId → index of the question that answers it */
export function blankOwners(flat: FlatQuestion[]): Map<string, number> {
  const m = new Map<string, number>();
  flat.forEach(({ q, index }) => questionBlankIds(q).forEach((b) => m.set(b, index)));
  return m;
}

/** text to show inside a blank chip for the current responses */
export function blankText(fq: FlatQuestion | undefined, blankId: string, responses: Responses): string | undefined {
  if (!fq) return undefined;
  const { q, section } = fq;
  const r = responses[q.id];
  const it = q.interaction;
  if (it.kind === 'inlineChoice') {
    const id = Array.isArray(r) ? r[0] : undefined;
    const opt = it.options.find((o) => o.id === id);
    return opt ? plainText(opt.content) : undefined;
  }
  if (it.kind === 'gapMatch') {
    const id = r && typeof r === 'object' && !Array.isArray(r) ? r[blankId] : undefined;
    const entry = section.bank?.find((b) => b.id === id);
    if (!entry) return undefined;
    return entry.id; // word/sentence banks show only the option letter on the line (#11)
  }
  if (it.kind === 'textEntry') {
    const v = r && typeof r === 'object' && !Array.isArray(r) ? r[blankId] : undefined;
    return v?.trim() ? v : undefined;
  }
  return undefined;
}

/** text of the correct answer for a blank (review mode) */
export function correctBlankText(fq: FlatQuestion, blankId: string, key: ItemKeyT): string | undefined {
  const k = key.answers[fq.q.id];
  const it = fq.q.interaction;
  if (!k) return undefined;
  if ('correct' in k) {
    if (it.kind === 'inlineChoice') {
      const opt = it.options.find((o) => o.id === k.correct[0]);
      return opt ? `${opt.id}. ${plainText(opt.content)}` : k.correct[0];
    }
    if (it.kind === 'gapMatch') {
      const i = questionBlankIds(fq.q).indexOf(blankId);
      const id = k.correct[i];
      return id; // option letter only, like the student's answer (#11)
    }
  }
  if ('slots' in k) return k.slots[blankId]?.accept[0];
  return undefined;
}

/** is this blank correct in the graded result (null = unknown) */
export function blankCorrect(result: Result | null, fq: FlatQuestion | undefined, blankId: string): boolean | null {
  if (!result || !fq) return null;
  const r = result.byQuestion.find((b) => b.q === fq.q.id);
  if (!r) return null;
  if (r.parts && blankId in r.parts) return r.parts[blankId];
  return r.correct;
}

function inlinesOf(b: BlockT): InlineT[][] {
  switch (b.type) {
    case 'paragraph':
    case 'heading':
      return [b.content];
    case 'list':
      return b.items;
    case 'dialogue':
      return b.turns.map((t) => [{ t: 'text', v: `${t.speaker}: ` } as InlineT, ...t.content]);
    case 'note':
      return [...(b.title ? [b.title] : []), ...(b.heading ? [b.heading] : []), ...(b.header ?? []), ...b.content, ...(b.signature ?? [])];
    case 'table':
      return b.rows.flatMap((r) => r.map((c) => c.content));
    default:
      return [];
  }
}

/**
 * sentence around a blank, as Inline[] trimmed to sentence boundaries, so the question card can show
 * the blank in context (useful on narrow screens where the article is on another tab)
 */
export function blankContext(item: ItemT, blankId: string): InlineT[] | null {
  for (const b of allBlocks(item)) {
    for (const run of inlinesOf(b)) {
      const idx = run.findIndex((n) => n.t === 'blank' && n.id === blankId);
      if (idx < 0) continue;
      // walk outward to the nearest sentence ends
      const isEnd = (s: string) => /[.!?]["”’)]*\s*$/.test(s);
      let start = idx;
      while (start > 0) {
        const prev = run[start - 1];
        if (prev.t === 'text' && isEnd(prev.v)) break;
        start--;
        // a sentence boundary inside this text node: keep the node, its head is trimmed below
        if (prev.t === 'text' && /[.!?]["”’)]*\s+\S/.test(prev.v)) break;
      }
      let end = idx;
      while (end < run.length - 1) {
        const next = run[end + 1];
        end++;
        if (next.t === 'text' && /[.!?]/.test(next.v)) break;
      }
      const slice = run.slice(start, end + 1).map((n, i, arr) => {
        if (n.t !== 'text') return n;
        let v = n.v;
        if (i === 0 && start > 0) v = v.replace(/^.*[.!?]["”’)]*\s+/s, '');
        if (i === arr.length - 1 && end > idx) v = v.replace(/([.!?]["”’)]*).*$/s, '$1');
        return { ...n, v };
      });
      return slice;
    }
  }
  return null;
}

/** evidence (block + quote) for a question (review highlighting) */
export function evidenceOf(key: ItemKeyT | null, qid: string | undefined): { block: string; quote: string }[] {
  if (!key || !qid) return [];
  return key.answers[qid]?.evidence ?? [];
}

/** show the printed first letter unless the student already typed the whole word */
export function showFirstLetter(firstLetter: string | undefined, text: string | undefined): boolean {
  if (!firstLetter) return false;
  return !text || !text.toLowerCase().startsWith(firstLetter.toLowerCase());
}
