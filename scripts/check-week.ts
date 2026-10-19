/**
 * Cheap, model-free checks for a transcribed week (token-lean pipeline, docs/production-brief.md):
 *  1. official letters — every `◆N.【X】` entry in the answer-book OCR is assigned to the item whose words its
 *     explanation shares most (the two-column pages interleave days in the OCR, so day headings can't be
 *     trusted), then compared with our key for single-letter questions of the first section
 *  2. text fidelity — share of the item's article / question words found in the OCR of its pages (catches
 *     invented or mis-copied text), and article word count vs the printed 词数 (catches omissions)
 *
 *   npx tsx scripts/check-week.ts <pl> <week>      exit 1 on a letter mismatch
 */
import { existsSync, readFileSync } from 'node:fs';
import type { ArticleItemT, InlineT, ItemKeyT } from '../schema/index.ts';
import { BOOKS } from './book-maps.mjs';

const [pl, wk] = process.argv.slice(2);
const week = Number(wk);
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
const pad = (n: number) => String(n).padStart(3, '0');
const page = (dir: string, p: number) => (existsSync(`.work/text/${dir}/p${pad(p)}.txt`) ? readFileSync(`.work/text/${dir}/p${pad(p)}.txt`, 'utf8') : '');
const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();
const words = (s: string) => norm(s).split(' ').filter((w) => w.length > 1);
// common words carry no signal when matching an answer explanation to its article
const STOP = new Set('the and for are but not you all any can had her was one our out has his how its may new now see two who did get let put say she too use that with have this will your from they know want been good much some time very when come here just like long make many more only over such take than them well were what into also each most where after first could their there these those would about other which while being every never often since still under'.split(' '));
const text = (n: InlineT[] = []) => n.map((x) => ('v' in x ? x.v : x.t === 'br' ? ' ' : '')).join('');

const keyText = BOOKS[pl].keyPages(week).map((p) => page(`${pl}-key`, p)).join('\n');
// answer entries: "◆3.【A】<explanation…>" up to the next ◆
const entries = [...keyText.matchAll(/◆\s*(\d{1,2})\s*[.．]\s*【\s*([A-LTF1Il])\s*】([^◆]*)/g)].map((m) => ({
  n: Number(m[1]),
  letter: m[2] === '1' || m[2] === 'l' ? 'I' : m[2], // OCR reads I as 1/l
  words: new Set(words(m[3]).filter((w) => w.length > 2 && !STOP.has(w))),
}));

const loaded = DAYS.map((day) => {
  const id = `${pl}-w${String(week).padStart(2, '0')}-${day}`;
  const f = `content/playlists/${pl}/items/${id}.json`;
  if (!existsSync(f)) return null;
  const item = JSON.parse(readFileSync(f, 'utf8')) as ArticleItemT; // 时文阅读 books only (KET: scripts/check-ket.ts)
  const key = JSON.parse(readFileSync(f.replace('/items/', '/keys/'), 'utf8')) as ItemKeyT;
  const all = JSON.stringify(item.article) + JSON.stringify(item.sections);
  return { id, item, key, vocab: new Set(words(all.replace(/"[a-zA-Z]+":/g, ' '))) };
}).filter((x): x is NonNullable<typeof x> => !!x);
// For each single-letter question, pick the answer entry with the same number whose explanation shares the
// most words with THAT question (stem + options; cloze/word-bank explanations list the option words),
// falling back to the whole article. Only confident picks are compared.
const qWords = (q: ArticleItemT['sections'][number]['questions'][number], bank?: { content: InlineT[] }[]) => {
  const it = q.interaction;
  const parts = ['prompt' in it ? text(it.prompt as InlineT[]) : '', 'options' in it ? it.options.map((o) => text(o.content)).join(' ') : ''];
  if (it.kind === 'gapMatch' && bank) parts.push(bank.map((b) => text(b.content)).join(' '));
  return new Set(words(parts.join(' ')).filter((w) => w.length > 2 && !STOP.has(w)));
};
const officialOf = new Map<string, Map<number, string>>();
for (const l of loaded) {
  const m = new Map<number, string>();
  const s0 = l.item.sections[0];
  for (const q of s0.questions) {
    const qw = qWords(q, s0.bank);
    const ranked = entries
      .filter((e) => e.n === q.number)
      .map((e) => ({
        e,
        q: [...e.words].filter((w) => qw.has(w)).length,
        a: [...e.words].filter((w) => l.vocab.has(w)).length,
        other: Math.max(0, ...loaded.filter((o) => o.id !== l.id).map((o) => [...e.words].filter((w) => o.vocab.has(w)).length)),
      }))
      .sort((x, y) => y.q - x.q || y.a - x.a);
    const [top, next] = ranked;
    // confident only: clearly about this question, or clearly about this article and no other
    const sure = top && ((top.q >= 3 && top.q - (next?.q ?? 0) >= 2) || (top.a >= 5 && top.a - top.other >= 3 && top.a - (next?.a ?? 0) >= 3));
    if (sure) m.set(q.number, top.e.letter);
  }
  officialOf.set(l.id, m);
}

let failed = false;
const lines: string[] = [];
for (const { id, item, key } of loaded) {
  // 1. official letters
  const official = officialOf.get(id) ?? new Map<number, string>();
  const qs = item.sections[0].questions;
  const mism: string[] = [];
  let compared = 0;
  for (const q of qs) {
    const k = key.answers[q.id];
    const o = official.get(q.number);
    if (!o || !k || !('correct' in k) || k.correct.length !== 1) continue;
    compared++;
    if (k.correct[0] !== o) mism.push(`${q.id}: key ${k.correct[0]} ≠ official ${o}`);
  }
  if (mism.length) failed = true;

  // 2. text fidelity
  const ocr = new Set(words(item.source.pdfPages.map((p) => page(pl, p)).join(' ')));
  const blockText = (b: ArticleItemT['article']['blocks'][number]): string => {
    if (b.type === 'table') return b.rows.flat().map((c) => text(c.content)).join(' ');
    if (b.type === 'note') return b.content.map((c) => text(c)).join(' ');
    if (b.type === 'list') return b.items.map((i) => text(i)).join(' ');
    if (b.type === 'dialogue') return b.turns.map((t) => text(t.content)).join(' ');
    return 'content' in b && Array.isArray(b.content) ? text(b.content as InlineT[]) : '';
  };
  const art = item.article.blocks.map(blockText).join(' ');
  // video: only when the page itself says so (the TOC bullets are not video marks)
  const pageSaysVideo =
    BOOKS[pl].video === 'weeklyIntensive' ? item.taskType.code === 'weekly_intensive' : item.source.pdfPages.some((p) => /视频讲解/.test(page(pl, p)));
  const videoWarn = pageSaysVideo !== !!item.meta.hasVideo ? ` · hasVideo ${item.meta.hasVideo} but the book ${pageSaysVideo ? 'marks' : 'does not mark'} a video` : '';
  const qtext = item.sections
    .flatMap((s) => s.questions)
    .map((q) => ('prompt' in q.interaction ? text(q.interaction.prompt as InlineT[]) : '') + ' ' + ('options' in q.interaction ? q.interaction.options.map((o) => text(o.content)).join(' ') : ''))
    .join(' ');
  const share = (s: string) => {
    const w = words(s);
    return w.length ? w.filter((x) => ocr.has(x)).length / w.length : 1;
  };
  const artWords = norm(art).split(' ').filter(Boolean).length;
  const ratio = item.meta.wordCount ? artWords / item.meta.wordCount : 1;
  const warn = share(art) < 0.93 || share(qtext) < 0.9 || ratio < 0.85 || ratio > 1.2 || !!videoWarn;
  lines.push(
    `${mism.length ? '✗' : warn ? '!' : '✓'} ${id}: letters ${compared ? `${compared - mism.length}/${compared} match official` : 'n/a'}${mism.length ? ` (${mism.join('; ')})` : ''}` +
      ` · text in OCR ${Math.round(share(art) * 100)}% / questions ${Math.round(share(qtext) * 100)}% · words ${artWords} vs 词数 ${item.meta.wordCount}${videoWarn}`,
  );
}
console.log(lines.join('\n') || `no items for ${pl} week ${week}`);
console.log('letters: only confidently matched answers are compared (two-column OCR); a ✗ is advisory — confirm against the answer-book line before changing a key.');
if (failed) process.exit(1);
