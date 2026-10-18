// Bundle everything a transcription agent needs for one week into ONE text file (token-cheap input):
// TOC lines, the book pages' OCR text, and the answer-book OCR text for that week.
//   node scripts/pack-week.mjs ci-g7 2   → .work/packs/ci-g7-w02.txt
// Requires: swift scripts/pdf-text.swift <pdf> .work/text/<pl>  (and .work/text/<pl>-key)
// Page images stay in .work/pages/<pl>/p###.jpg — agents view them only for highlights / crops.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { BOOKS } from './book-maps.mjs';

const [pl, wk] = process.argv.slice(2);
const week = Number(wk);
const BOOK = BOOKS[pl];
if (!BOOK) throw new Error(`no page map for ${pl} in scripts/book-maps.mjs`);
const OFFSET = BOOK.offset;
const txt = (dir, p) => {
  const f = `.work/text/${dir}/p${String(p).padStart(3, '0')}.txt`;
  return existsSync(f) ? readFileSync(f, 'utf8') : '';
};

// TOC (book pages p005–p009): "Week N" blocks with "<type> <title> … <bookPage>"
const toc = [5, 6, 7, 8, 9].map((p) => txt(pl, p)).join('\n');
const blocks = toc.split(/Week\s*(\d+)/);
let weekToc = '';
for (let i = 1; i < blocks.length; i += 2) if (Number(blocks[i]) === week) weekToc = blocks[i + 1];
const starts = BOOK.weekStart;
const start = starts?.[week - 1];
const end = starts?.[week] ? starts[week] - 1 : start + 9; // book pages of this week
if (!start) throw new Error(`week ${week} not found in TOC`);

const out = [];
out.push(`# ${pl} week ${week} — book pdf "${BOOK.pdf}", answer pdf "${BOOK.keyPdf}" — text pack (OCR; may contain spacing / symbol errors — the page image is authoritative)`);
out.push(`book pages ${start}–${end} = PDF pages p${start + OFFSET}–p${end + OFFSET} (book N = PDF p(N+${OFFSET}))`);
out.push('\n## TOC lines\n' + weekToc.replace(/⋯+/g, ' … ').trim());
for (let b = start; b <= end; b++) out.push(`\n## BOOK page ${b} = PDF p${b + OFFSET} (image: .work/pages/${pl}/p${String(b + OFFSET).padStart(3, '0')}.jpg)\n` + txt(pl, b + OFFSET).trim());
// answer book pages for this week (scripts/book-maps.mjs)
const keyPages = BOOK.keyPages(week).filter((p) => txt(`${pl}-key`, p));
for (const p of keyPages) out.push(`\n## ANSWER BOOK PDF p${p} (image: .work/pages/${pl}-key/p${String(p).padStart(3, '0')}.jpg)\n` + txt(`${pl}-key`, p).trim());

mkdirSync('.work/packs', { recursive: true });
const file = `.work/packs/${pl}-w${String(week).padStart(2, '0')}.txt`;
writeFileSync(file, out.join('\n') + '\n');
console.log(`${file}: book ${start}–${end}, answer pages ${keyPages.join(',')}, ${out.join('\n').length} chars`);
