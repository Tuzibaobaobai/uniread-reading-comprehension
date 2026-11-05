// What a 词汇天天练 recording says vs the printed IPA (#131): a phoneme recogniser (scripts/py/phonemes.py, wav2vec2 espeak
// model) and a vowel-by-vowel comparison. Used by scripts/check-pron-audio.mjs and scripts/tts.mjs --lexicon (verify + retry).
// One-time setup (≈1 GB, kept in .work/): python3 -m venv .work/venv-pron && .work/venv-pron/bin/pip install torch transformers soundfile numpy
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

export const RECOGNISER = '.work/venv-pron/bin/python';
export const recogniserReady = () => existsSync(RECOGNISER);

/** file → the IPA phones the recogniser hears; onEach(file, phones) as they come */
export function recognise(files, onEach) {
  return new Promise((resolve, reject) => {
    const out = new Map();
    if (!files.length) return resolve(out);
    const child = spawn(RECOGNISER, ['scripts/py/phonemes.py', ...files], { stdio: ['ignore', 'pipe', 'ignore'] });
    let buf = '';
    child.stdout.on('data', (d) => {
      buf += d;
      for (let i; (i = buf.indexOf('\n')) >= 0; ) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line.startsWith('{')) continue;
        const { file, phones } = JSON.parse(line);
        out.set(file, phones);
        onEach?.(file, phones);
      }
    });
    child.on('error', reject);
    child.on('close', () => resolve(out));
  });
}

// ---- vowels: what the pin says (ARPAbet) vs what the recogniser hears (espeak IPA) ----
const HEARD_VOWEL = /[aeiouæɑɒɔəɐɚɛɜɝɪʊʌᵻɨ]/;
/** recognised token → vowel class */
function heardClass(t) {
  const m = {
    'ɐ': 'R', 'ə': 'R', 'ᵻ': 'R', 'ɨ': 'R', 'ɚ': 'ER',
    'ɪ': 'IH', 'i': 'IY', 'iː': 'IY', 'ɛ': 'EH', 'e': 'EH', 'eː': 'EY', 'æ': 'AE', 'a': 'A', 'ʌ': 'AH', 'oɪ': 'OY',
    'ɑ': 'AA', 'ɑː': 'AA', 'aː': 'AA', 'ɒ': 'AA', 'ɔ': 'AO', 'ɔː': 'AO', 'oː': 'AO', 'ʊ': 'UH', 'u': 'UW', 'uː': 'UW',
    'ɜ': 'ER', 'ɜː': 'ER', 'ɝ': 'ER', 'oʊ': 'OW', 'o': 'OW', 'əʊ': 'OW', 'eɪ': 'EY', 'aɪ': 'AY', 'ɔɪ': 'OY', 'aʊ': 'AW',
    'ɪɹ': 'IH', 'ɛɹ': 'EH', 'ʊɹ': 'UH', 'ɑːɹ': 'AA', 'ɔːɹ': 'AO', 'ɔɹ': 'AO', 'aɪɚ': 'AY', 'aɪə': 'AY', 'iə': 'IY',
  };
  return m[t] ?? (/[ɐə]/.test(t) ? 'R' : t);
}
/** which heard classes may stand for an expected vowel: reduced ones are free between ə ɪ ʊ ɚ; full ones keep their quality */
function accepts(exp, heard, last = false, beforeL = false, first = false) {
  const b = exp.replace(/\d$/, '');
  const weak = exp.endsWith('0') || exp === 'AX';
  if (weak && ['AH', 'AX', 'ER', 'UH'].includes(b)) {
    // a schwa: never a full front / open vowel (affect said /ˈæfekt/ or /ɛˈfekt/ is the #131 bug). The recogniser writes a
    // word-final schwa as "a" (banana) and a schwa before dark l as "o" (adult, apple).
    if (['R', 'ER', 'IH', 'UH', 'AH', 'UW'].includes(heard)) return true; // ʊ / uː: accurate /ˈækjərət/ ~ US /ˈækjʊrət/
    if (['AE', 'A'].includes(heard) && last) return true;
    if (heard === 'AA' && (last || beforeL)) return true; // able: a final dark l
    if (heard === 'EH' && !first) return true; // vitamin /ˈvɪtəmɪn/ -min: not the word-initial schwa of affect
    return (beforeL || last) && ['OW', 'AO'].includes(heard);
  }
  if (weak && b === 'IH') return ['R', 'IH', 'IY', 'EH', 'ER', 'UH'].includes(heard);
  // an unstressed full vowel (the -day of Monday /ˈmʌndeɪ/, the -ate of separate): its quality, or reduced
  const ok = {
    // the recogniser's "a" is any open vowel (æ, US ɑ, ʌ); it writes the US /oʊ/ of the voice as aʊ now and then (ago, though)
    AE: ['AE', 'EH', 'A'], EH: ['EH', 'AE', 'EY'], IH: ['IH', 'IY', 'EH', 'R'], IY: ['IY', 'IH'], AH: ['AH', 'AA', 'R', 'AO', 'A'],
    AA: ['AA', 'AO', 'AH', 'AE', 'A'] /* bath words in a US voice */, AO: ['AO', 'AA', 'OW', 'A'], UH: ['UH', 'UW', 'R'], UW: ['UW', 'UH'], ER: ['ER', 'R'],
    OW: ['OW', 'AO', 'AW'], EY: ['EY', 'EH'], AY: ['AY'], OY: ['OY'], AW: ['AW', 'OW'],
  }[b] ?? [b];
  return ok.includes(heard) || (weak && ['R', 'IH'].includes(heard));
}
const expVowels = (cmu) => cmu.split(' ').filter((p) => /\d$/.test(p) || p === 'AX');
/** heard vowels, each with whether it is the last one and whether an l follows */
const heardVowels = (phones) => {
  const t = phones.split(' ');
  const v = t.map((x, i) => [x, i]).filter(([x]) => HEARD_VOWEL.test(x));
  return v.map(([x, i], k) => ({ c: heardClass(x), last: k === v.length - 1, beforeL: t[i + 1] === 'l' }));
};

/** align expected and heard vowels; the problems found */
export function compare(expected, phones) {
  const e = expected.flatMap(expVowels);
  const h = heardVowels(phones);
  const ok = (i, j) => accepts(e[i], h[j].c, h[j].last, h[j].beforeL, j === 0);
  const d = Array.from({ length: e.length + 1 }, (_, i) => Array.from({ length: h.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= e.length; i++)
    for (let j = 1; j <= h.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ok(i - 1, j - 1) ? 0 : 1));
  const problems = [];
  for (let i = e.length, j = h.length; i > 0 || j > 0; ) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (ok(i - 1, j - 1) ? 0 : 1)) {
      if (!ok(i - 1, j - 1)) problems.unshift(`${e[i - 1]} heard as ${h[j - 1].c}`);
      i--, j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) problems.unshift(`${e[--i]} not heard`);
    else problems.unshift(`extra vowel ${h[--j].c}`);
  }
  // a dropped or extra weak vowel next to l / n / r (syllabic consonants: little, Britain, fire) is not a different word
  // the recogniser hears /juː/ as i ʊ (abuse); a weak final -ia as one vowel (Australia)
  const y = expected.some((c) => /(^| )Y /.test(c));
  return problems.filter(
    (p) => !/^(AH0|AX|ER0|IH0|IY0|\w+2) not heard$|^extra vowel (R|ER|AH)$/.test(p) && !(y && /^extra vowel (IY|IH)$/.test(p)),
  );
}

