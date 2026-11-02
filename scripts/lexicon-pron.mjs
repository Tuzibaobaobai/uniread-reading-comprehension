// 词汇天天练 audio standard (#131): every recording says a word the way the book's IPA prints it. A word with more than one
// pronunciation (adult /ˈædʌlt/ vs /əˈdʌlt/) — or one the TTS voice simply gets wrong (affect) — is not left to the voice:
// this script picks, for each entry, the CMU-dictionary pronunciation that matches the printed IPA, and the pronunciation of
// each underlined form in the examples (adults, affected…), and writes them to content/lexicons/<lx>/pronunciations.json.
// scripts/tts.mjs --lexicon <lx> then wraps those words in SSML <phoneme alphabet="cmu"> so the voice says exactly that.
//   node scripts/lexicon-pron.mjs <lexicon>            → pronunciations.json + a report of what needs a person's ear
// The CMU dictionary is downloaded once to .work/cmudict.dict. Entries marked "manual": true in pronunciations.json are kept.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const lexicon = process.argv[2];
if (!lexicon) {
  console.error('usage: node scripts/lexicon-pron.mjs <lexicon>');
  process.exit(1);
}

const dictFile = '.work/cmudict.dict';
if (!existsSync(dictFile)) {
  mkdirSync('.work', { recursive: true });
  const res = await fetch('https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict');
  if (!res.ok) throw new Error(`cmudict download ${res.status}`);
  writeFileSync(dictFile, await res.text());
}
/** word → its pronunciations, each an array of ARPAbet phones with stress digits */
const cmu = new Map();
for (const line of readFileSync(dictFile, 'utf8').split('\n')) {
  const m = /^([^\s(]+)(?:\(\d+\))?\s+([^#]+)/.exec(line);
  if (!m) continue;
  const w = m[1].toLowerCase();
  if (!cmu.has(w)) cmu.set(w, []);
  cmu.get(w).push(m[2].trim().split(/\s+/));
}

// ---- printed IPA → ARPAbet (British-style IPA as the handbooks print it) ----
const VOWELS = [
  ['aɪə', 'AY R'], ['aʊə', 'AW R'], // fire, power: one stressed vowel + r in CMU
  ['eɪ', 'EY'], ['aɪ', 'AY'], ['ɔɪ', 'OY'], ['əʊ', 'OW'], ['oʊ', 'OW'], ['aʊ', 'AW'], ['ɪə', 'IY R'], ['eə', 'EH R'], ['ʊə', 'UH R'],
  ['iː', 'IY'], ['i:', 'IY'], ['ɑː', 'AA'], ['ɑ:', 'AA'], ['ɔː', 'AO'], ['ɔ:', 'AO'], ['uː', 'UW'], ['u:', 'UW'], ['ɜː', 'ER'], ['ɜ:', 'ER'],
  ['ɪ', 'IH'], ['e', 'EH'], ['ɛ', 'EH'], ['æ', 'AE'], ['ʌ', 'AH'], ['ɒ', 'AA'], ['ʊ', 'UH'], ['ə', 'AH'], ['ɚ', 'ER'], ['ɝ', 'ER'],
  ['i', 'IY'], ['u', 'UW'], ['ɔ', 'AO'], ['ɑ', 'AA'], ['a', 'AE'], ['o', 'OW'],
];
const CONS = [
  ['tʃ', 'CH'], ['dʒ', 'JH'], ['θ', 'TH'], ['ð', 'DH'], ['ʃ', 'SH'], ['ʒ', 'ZH'], ['ŋ', 'NG'], ['ɡ', 'G'], ['g', 'G'], ['ɹ', 'R'], ['r', 'R'],
  ['j', 'Y'], ['h', 'HH'], ['p', 'P'], ['b', 'B'], ['t', 'T'], ['d', 'D'], ['k', 'K'], ['f', 'F'], ['v', 'V'], ['s', 'S'], ['z', 'Z'],
  ['m', 'M'], ['n', 'N'], ['l', 'L'], ['w', 'W'], ['x', 'K'],
];
const TOKENS = [...VOWELS.map(([k, v]) => [k, v, true]), ...CONS.map(([k, v]) => [k, v, false])].sort((a, b) => b[0].length - a[0].length);

/** IPA → ARPAbet phones; null when a symbol is not understood */
export function ipaToArpa(ipa) {
  const s = ipa.replace(/\([^)]*\)/g, '').replace(/[/\s.]/g, '').replace(/ˑ/g, '');
  const out = [];
  let stress = null;
  for (let i = 0; i < s.length; ) {
    const c = s[i];
    if (c === 'ˈ' || c === "'") (stress = '1'), i++;
    else if (c === 'ˌ' || c === ',') (stress = '2'), i++;
    else {
      const tok = TOKENS.find(([k]) => s.startsWith(k, i));
      if (!tok) return null;
      const [k, v, vowel] = tok;
      if (vowel) {
        const [first, ...rest] = v.split(' ');
        // ə is always reduced; any other unmarked vowel is unstressed (fixed below for one-syllable words)
        out.push(first + (k === 'ə' ? '0' : (stress ?? '0')), ...rest);
        stress = null;
      } else out.push(v);
      i += k.length;
    }
  }
  const vowels = out.filter((p) => /\d$/.test(p));
  if (vowels.length === 1) out[out.indexOf(vowels[0])] = vowels[0].replace(/\d$/, '1');
  return out;
}

const isVowel = (p) => /\d$/.test(p);
const base = (p) => p.replace(/\d$/, '');
/** how different two phones are: the printed stress matters most, vowel colour of unstressed syllables least */
function subCost(a, b) {
  if (a === b) return 0;
  if ((a === 'R' && /^ER/.test(b)) || (b === 'R' && /^ER/.test(a))) return 0.3; // power: AW1 ER0 ~ AW1 R
  if (isVowel(a) && isVowel(b)) {
    const sa = a.at(-1) !== '0';
    const sb = b.at(-1) !== '0';
    if (sa !== sb) return 1.5; // stress on a different syllable: the adult / affect case
    if (base(a) === base(b)) return 0.2; // primary vs secondary
    return sa ? 1 : 0.3; // reduced vowels differ freely between dictionaries
  }
  return isVowel(a) || isVowel(b) ? 2 : 1;
}
const indel = (p) => (p === 'R' ? 0.3 : isVowel(p) ? 1.2 : 1); // British IPA drops the r that US CMU keeps
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i === 0 ? 0 : 0]);
  for (let i = 1; i <= a.length; i++) d[i][0] = d[i - 1][0] + indel(a[i - 1]);
  for (let j = 1; j <= b.length; j++) d[0][j] = d[0][j - 1] + indel(b[j - 1]);
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + indel(a[i - 1]), d[i][j - 1] + indel(b[j - 1]), d[i - 1][j - 1] + subCost(a[i - 1], b[j - 1]));
  return d[a.length][b.length];
}
const best = (target, variants) =>
  variants.map((v) => ({ v, d: distance(target, v) })).sort((x, y) => x.d - y.d)[0];

// ---- per entry ----
const dir = join('content/lexicons', lexicon, 'entries');
const outFile = join('content/lexicons', lexicon, 'pronunciations.json');
const previous = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')).entries ?? {} : {};
const entries = {};
const review = [];
const words = (t) => t.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];

for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const e = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  if (previous[e.id]?.manual) {
    entries[e.id] = previous[e.id];
    continue;
  }
  const head = e.headword.toLowerCase();
  if (!e.ipa?.length || words(head).length !== 1 || words(head)[0] !== head) continue; // phrases: no printed IPA to follow
  const printed = ipaToArpa(e.ipa[0]);
  if (!printed) {
    review.push(`${e.id}: IPA /${e.ipa[0]}/ not understood — add it by hand ("manual": true)`);
    continue;
  }
  const variants = cmu.get(head) ?? [];
  let pron = printed;
  let from = 'ipa';
  if (variants.length) {
    const b = best(printed, variants);
    // close enough: the dictionary's (US) form of the printed pronunciation; else the printed IPA itself
    if (b.d <= Math.max(1.5, printed.length * 0.25)) (pron = b.v), (from = 'cmudict');
    else review.push(`${e.id}: /${e.ipa[0]}/ matches no CMU pronunciation of "${head}" (${variants.map((v) => v.join(' ')).join(' | ')}) — using the IPA as printed`);
  } else review.push(`${e.id}: "${head}" is not in the CMU dictionary — using the IPA as printed (${printed.join(' ')}); listen to it`);
  const entry = { ipa: e.ipa[0], cmu: pron.join(' '), from, forms: { [head]: pron.join(' ') } };
  if (e.ipa.length > 1) {
    // two printed pronunciations (abuse n. /əˈbjuːs/, v. /əˈbjuːz/): which one an example uses depends on its meaning
    entry.examples = false;
    review.push(`${e.id}: ${e.ipa.length} printed pronunciations (${e.ipa.map((p) => `/${p}/`).join(' ')}) — the word clip uses the first; examples are left to the voice unless set by hand`);
  } else {
    // the underlined forms in the examples: the dictionary pronunciation nearest the headword's
    for (const x of e.examples) {
      for (const n of x.en) {
        if (n.t !== 'underline') continue;
        for (const w of words(n.v ?? '')) {
          if (entry.forms[w]) continue;
          const vs = cmu.get(w);
          if (!vs?.length) continue;
          const b = best(pron, vs);
          // only forms of this word: share its stressed vowel
          if (b.d <= pron.length * 0.6) entry.forms[w] = b.v.join(' ');
        }
      }
    }
  }
  entries[e.id] = entry;
}

writeFileSync(
  outFile,
  JSON.stringify(
    {
      note: 'Generated by scripts/lexicon-pron.mjs (#131): CMU pronunciations matching the printed IPA, used by scripts/tts.mjs as SSML <phoneme alphabet="cmu">. Set "manual": true on an entry to keep a hand edit.',
      entries,
    },
    null,
    2,
  ) + '\n',
);
console.log(`${Object.keys(entries).length} entries → ${outFile}`);
if (review.length) console.log(`\nneeds a person (${review.length}):\n  ${review.join('\n  ')}`);
