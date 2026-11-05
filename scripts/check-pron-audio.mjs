// 词汇天天练 audio check (#131): does each headword recording say the vowels the book's IPA prints?
//   node scripts/check-pron-audio.mjs <lexicon> [--all] [--ids e-affect,e-adult] [--out .work/pron-check-<lx>.json]
// Runs a phoneme recogniser (scripts/py/phonemes.py, wav2vec2 espeak model) over the word clips of every entry pinned in
// content/lexicons/<lx>/pronunciations.json (default) or of every entry (--all), and compares the vowels it hears with the
// pinned pronunciation: same number of syllables, a full vowel where the print has one, a reduced vowel where it prints ə
// (the affect /əˈfekt/ case), and the quality of each full vowel (adult /ˈædʌlt/ starts with æ). Consonant voicing at the
// end of a word (close /z/ vs /s/) is not judged: the recogniser is not reliable there — those are for a person's ear.
// One-time setup (≈1 GB, kept in .work/):
//   python3 -m venv .work/venv-pron && .work/venv-pron/bin/pip install torch transformers soundfile numpy
// Prints the clips that disagree and writes all results to .work/pron-check-<lx>.json. Exit code 1 when any disagree.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { compare, recognise, recogniserReady } from './lib/pron-check.mjs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const lx = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--ids' && args[args.indexOf(a) - 1] !== '--out');
const opt = (n) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
if (!lx) {
  console.error('usage: node scripts/check-pron-audio.mjs <lexicon> [--all] [--ids a,b] [--out file]');
  process.exit(1);
}
if (!recogniserReady()) {
  console.error('phoneme recogniser not set up: python3 -m venv .work/venv-pron && .work/venv-pron/bin/pip install torch transformers soundfile numpy');
  process.exit(1);
}

const prons = JSON.parse(readFileSync(join('content/lexicons', lx, 'pronunciations.json'), 'utf8')).entries;
const ids = opt('ids')?.split(',');
const jobs = [];
for (const f of readdirSync(join('content/lexicons', lx, 'entries')).sort()) {
  const e = JSON.parse(readFileSync(join('content/lexicons', lx, 'entries', f), 'utf8'));
  if (ids ? !ids.includes(e.id) : !args.includes('--all') && !prons[e.id]) continue;
  const p = prons[e.id];
  const expected = p?.say ? p.say.map((s) => s.cmu) : p?.cmu ? [p.cmu] : null;
  if (!e.audio?.word || !expected) continue;
  jobs.push({ id: e.id, headword: e.headword, ipa: e.ipa, expected, file: join('content', e.audio.word.src) });
}

// ---- run the recogniser once over every file ----
const results = [];
const byFile = new Map(jobs.map((j) => [j.file, j]));
let n = 0;
await recognise(jobs.map((j) => j.file), (file, phones) => {
  const j = byFile.get(file);
  const problems = compare(j.expected, phones);
  results.push({ id: j.id, headword: j.headword, ipa: j.ipa, expected: j.expected, heard: phones, ok: !problems.length, problems });
  if (++n % 500 === 0) console.log(`${n}/${jobs.length}`);
});
const bad = results.filter((r) => !r.ok);
const out = opt('out') ?? `.work/pron-check-${lx}.json`;
writeFileSync(out, JSON.stringify({ lexicon: lx, checked: results.length, disagree: bad.length, results }, null, 2) + '\n');
for (const r of bad) console.log(`✗ ${r.id} /${[].concat(r.ipa).join('/ /')}/ expected ${r.expected.join(' , ')} — heard "${r.heard}": ${r.problems.join('; ')}`);
console.log(`${results.length} word clip(s) checked, ${bad.length} disagree with the printed IPA → ${out}`);
process.exit(bad.length ? 1 : 0);
