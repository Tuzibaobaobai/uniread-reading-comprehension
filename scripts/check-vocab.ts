/**
 * Compare 词汇天天练 keys with the book's answer pages (token-free check after transcription, #110).
 *   npx tsx scripts/check-vocab.ts <itemId…>        e.g. zkv-d01 zkv-d63
 * The answer pages mix two columns and several days, so this does not align question by question: it checks that every
 * English answer in the key (words, forms, blanks, the first reference translation) is printed on the key's
 * officialRef pages (OCR in .work/text/<pl>/daily/p###.txt). A miss is a likely typo or a wrong answer — check the page image.
 */
import { existsSync, readFileSync } from 'node:fs';
import type { ItemKeyT } from '../schema/index.ts';

const squash = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .trim();

let problems = 0;
for (const id of process.argv.slice(2)) {
  const pl = id.replace(/-d\d{2}$/, '');
  const key = JSON.parse(readFileSync(`content/playlists/${pl}/keys/${id}.json`, 'utf8')) as ItemKeyT;
  const pages = key.officialRef?.pages ?? [];
  const text = ` ${pages
    .map((p) => `.work/text/${pl}/daily/p${String(p).padStart(3, '0')}.txt`)
    .filter((f) => existsSync(f))
    .map((f) => readFileSync(f, 'utf8').split('\n').map((l) => l.replace(/^[\d.]+ [\d.]+ [\d.]+ /, '')).join(' '))
    .map(squash)
    .join(' ')} `;
  if (!text.trim()) {
    console.log(`${id}: no OCR for pages ${pages.join(', ')}`);
    problems++;
    continue;
  }
  const missing: string[] = [];
  const need = (qid: string, answer: string) => {
    const a = squash(answer.replace(/\([^)]*\)/g, ' '));
    if (!a || text.includes(` ${a} `)) return;
    // sentences: OCR misreads a letter here and there (I → 1) and wraps lines between the columns — accept 90 % of the
    // words with a run of four printed together
    const words = a.split(' ');
    if (words.length >= 5) {
      const found = words.filter((w) => text.includes(` ${w} `)).length / words.length;
      const run = words.some((_, i) => i + 4 <= words.length && text.includes(` ${words.slice(i, i + 4).join(' ')} `));
      if (found >= 0.9 && run) return;
    }
    missing.push(`${qid}: ${answer}`);
  };
  for (const [qid, k] of Object.entries(key.answers)) {
    if ('word' in k && 'pos' in k) need(qid, k.word[0]);
    else if ('forms' in k) Object.values(k.forms).forEach((f) => need(qid, f.word[0]));
    else if ('slots' in k) Object.values(k.slots).forEach((s) => need(qid, s.accept[0]));
    else if ('sampleAnswer' in k) need(qid, (k.references ?? [k.sampleAnswer])[0]);
  }
  problems += missing.length;
  console.log(`${id}: ${Object.keys(key.answers).length} answers, ${missing.length} not found on p${pages.join(', p')}`);
  missing.forEach((m) => console.log(`  ${m}`));
}
process.exit(problems ? 1 : 0);
