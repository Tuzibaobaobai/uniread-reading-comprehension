/**
 * Compare KET keys with the answer book (token-free check after transcription).
 *   npx tsx scripts/check-ket.ts <test> [playlist=ket1]
 * Reads the answer-book OCR (.work/text/<pl>/t<N>-key/*.txt, from scripts/ocr.swift), parses the
 * "Reading and Writing" (Q1–30) and "Listening" (Q1–25) answer lists, and checks every key:
 * choice / inlineChoice letters must match; text answers must accept every printed alternative
 * ("25(th) June / June 25(th)" → 25 June, 25th June, June 25, June 25th).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ItemKeyT } from '../schema/index.ts';
import { normalizeText } from '../src/lib/grading.ts';

const [test, pl = 'ket1'] = process.argv.slice(2);
if (!test) {
  console.error('usage: npx tsx scripts/check-ket.ts <test> [playlist]');
  process.exit(1);
}
const ROOT = join(import.meta.dirname, '..');
const ocrDir = join(ROOT, '.work/text', pl, `t${test}-key`);

/** OCR lines in reading order, Cyrillic look-alikes mapped back to Latin */
const lines = readdirSync(ocrDir)
  .sort()
  .flatMap((f) => readFileSync(join(ocrDir, f), 'utf8').split('\n'))
  .map((l) => l.split(' ').slice(3).join(' '))
  .map((l) => l.replace(/[АВСЕНЗ]/g, (c) => ({ А: 'A', В: 'B', С: 'C', Е: 'E', Н: 'H', З: '3' })[c]!));

/**
 * answers between two headings, read sequentially: "1 B 2 C … 10 238 11 A" — a token equal to the next
 * question number starts the next answer (numeric answers like "238" or "0776 3214" stay intact)
 */
function answers(from: RegExp, to: RegExp, count: number): Map<number, string> {
  const start = lines.findIndex((l) => from.test(l));
  const end = lines.findIndex((l, i) => i > start && to.test(l));
  const tokens = lines
    .slice(start + 1, end)
    // drop Part headings, running heads ("Test 1 answer key and transcript") and page numbers
    .filter((l) => !/^Part \d|answer key|^\d{2,3}$/.test(l))
    .join(' ')
    .replace(/\b(\d{1,2})([A-H])\b/g, '$1 $2') // "5B 6A"
    .split(/\s+/)
    .filter(Boolean);
  const out = new Map<number, string>();
  let q = 0;
  for (const tok of tokens) {
    // next number, or the one after it when the OCR lost a whole answer ("5 C 7 A")
    const n = [q + 1, q + 2].find((x) => tok === String(x) && x <= count && (q === 0 || out.get(q)));
    if (n) {
      q = n;
      out.set(q, '');
    } else if (q) out.set(q, `${out.get(q)} ${tok}`.trim());
  }
  return out;
}

/** "(al)though" → though, although; "25(th) June" → 25 June, 25th June */
function variants(printed: string): string[] {
  return printed.split('/').flatMap((alt) => {
    let out = [''];
    for (const part of alt.trim().split(/(\([^)]*\))/)) {
      if (!part) continue;
      const opt = /^\((.*)\)$/.exec(part);
      out = opt ? out.flatMap((s) => [s, s + opt[1]]) : out.map((s) => s + part);
    }
    return out.map((s) => normalizeText(s));
  });
}

const papers: [string, RegExp, RegExp, number][] = [
  ['rw', /^Reading and Writing/, /^Part 6|^Sample answer/, 30],
  ['l', /^Listening$/, /^Transcript/, 25],
];
let problems = 0;
for (const [paper, from, to, count] of papers) {
  const printed = answers(from, to, count);
  const lost = [...Array(count).keys()].map((i) => i + 1).filter((n) => !printed.get(n));
  if (lost.length) (problems++, console.log(`${paper}: answers ${lost.join(', ')} not found in the OCR — check the answer-book page image by hand`));
  const key = JSON.parse(readFileSync(join(ROOT, 'content/playlists', pl, 'keys', `${pl}-t${test}-${paper}.json`), 'utf8')) as ItemKeyT;
  for (const [n, ans] of printed) {
    const k = key.answers[`q${n}`];
    const bad = (m: string) => (problems++, console.log(`${paper} Q${n}: ${m}`));
    if (!k) bad(`no key (book: ${ans})`);
    else if ('correct' in k) {
      if (/^[A-H]$/.test(ans) && k.correct.join() !== ans) bad(`key ${k.correct} ≠ book ${ans}`);
      else if (!/^[A-H]$/.test(ans)) bad(`book answer "${ans}" is text but key is a choice`);
    } else if ('slots' in k) {
      const accept = Object.values(k.slots).flatMap((s) => s.accept.map((a) => normalizeText(a)));
      const missing = variants(ans).filter((v) => !accept.includes(v));
      if (missing.length) bad(`accept list lacks ${missing.join(', ')} (book: ${ans})`);
    } else bad('unexpected key type');
  }
  console.log(`${paper}: ${printed.size} printed answers checked`);
}
console.log(problems ? `${problems} mismatch(es)` : '0 mismatches');
process.exit(problems ? 1 : 0);
