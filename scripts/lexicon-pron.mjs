// 词汇天天练 audio standard (#131): every recording says a word the way the book's IPA prints it. A word with more than one
// pronunciation (adult /ˈædʌlt/ vs /əˈdʌlt/) — or one the TTS voice simply gets wrong (affect) — is not left to the voice:
// this script works out, for each entry, the phones of the printed IPA and the pronunciation of each underlined form in the
// examples (adults, affected…), and writes them to content/lexicons/<lx>/pronunciations.json.
// scripts/tts.mjs --lexicon <lx> then wraps those words in SSML <phoneme alphabet="cmu"> so the voice says exactly that.
//   node scripts/lexicon-pron.mjs <lexicon>            → pronunciations.json + a report of what needs a person's ear
// The CMU dictionary is downloaded once to .work/cmudict.dict. Entries marked "manual": true in pronunciations.json are kept.
//
// How a pronunciation is chosen (second pass of #131, after affect was still said /ˈæfekt/):
//   - The printed IPA is the source. A CMU-dictionary pronunciation is used instead only when it AGREES with it — the same
//     consonants (bar the r British IPA leaves out and the j of /djuː/), a vowel for every printed vowel of the same quality
//     (British ↔ US equivalents allowed, e.g. ɒ ~ AA/AO), and the primary stress on the same vowel. Otherwise (zebra
//     /ˈzebrə/ is not CMU's Z IY1 B R AH0; conduct /kənˈdʌkt/ is not K AA0 N…) the printed IPA is converted directly.
//   - Headwords that are not one plain word — variants "a (an)", "although / though", "colour (color)", "toward(s)", and
//     phrases with printed IPA — get "say": one pronunciation per printed IPA, read in order (a (an) → /eɪ/, /ə/).
//   - ə is written AH0 here (CMU convention); scripts/tts.mjs sends it to the voice as AX, the only schwa it honours.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// ---- printed IPA → ARPAbet (British-style IPA as the handbooks print it) ----
// centring diphthongs: before an r (clear /klɪə(r)/, experience /ɪkˈspɪəriəns/) the vowel + R, as CMU writes them; else two
// vowels (idea /aɪˈdɪə/ → IY1 AH0, diet /ˈdaɪət/ → AY1 AH0). ɒ is OH until the end so that it may match US AA / AO, while ɑː
// (aunt, class) stays AA.
const BEFORE_R = { 'aɪə': 'AY ER', 'aʊə': 'AW ER', 'ɪə': 'IH R', 'eə': 'EH R', 'ʊə': 'UH R' };
const VOWELS = [
  ['aɪə', 'AY AH'], ['aʊə', 'AW AH'],
  ['eɪ', 'EY'], ['aɪ', 'AY'], ['ɔɪ', 'OY'], ['əʊ', 'OW'], ['oʊ', 'OW'], ['aʊ', 'AW'], ['ɪə', 'IY AH'], ['eə', 'EH'], ['ʊə', 'UH AH'],
  ['iː', 'IY'], ['i:', 'IY'], ['ɑː', 'AA'], ['ɑ:', 'AA'], ['ɔː', 'AO'], ['ɔ:', 'AO'], ['uː', 'UW'], ['u:', 'UW'], ['ɜː', 'ER'], ['ɜ:', 'ER'],
  ['ɪ', 'IH'], ['e', 'EH'], ['ɛ', 'EH'], ['æ', 'AE'], ['ʌ', 'AH'], ['ɒ', 'OH'], ['ʊ', 'UH'], ['ə', 'AH'], ['ɚ', 'ER'], ['ɝ', 'ER'],
  ['i', 'IY'], ['u', 'UW'], ['ɔ', 'AO'], ['ɑ', 'AA'], ['a', 'AE'], ['o', 'OW'],
];
const CONS = [
  ['tʃ', 'CH'], ['dʒ', 'JH'], ['θ', 'TH'], ['ð', 'DH'], ['ʃ', 'SH'], ['ʒ', 'ZH'], ['ŋ', 'NG'], ['ɡ', 'G'], ['g', 'G'], ['ɹ', 'R'], ['r', 'R'],
  ['j', 'Y'], ['h', 'HH'], ['p', 'P'], ['b', 'B'], ['t', 'T'], ['d', 'D'], ['k', 'K'], ['f', 'F'], ['v', 'V'], ['s', 'S'], ['z', 'Z'],
  ['m', 'M'], ['n', 'N'], ['l', 'L'], ['w', 'W'], ['x', 'K'],
];
const TOKENS = [...VOWELS.map(([k, v]) => [k, v, true]), ...CONS.map(([k, v]) => [k, v, false])].sort((a, b) => b[0].length - a[0].length);

/** IPA → ARPAbet phones; null when a symbol is not understood. The printed optional r — "ə(r)" — is said (the voice is
 *  American, and CMU keeps it too); other optional sounds — toward(s) /təˈwɔːd(z)/ — are left out, as the headword's first form. */
export function ipaToArpa(ipa) {
  const s = ipa
    .replace(/\(r\)/g, 'r')
    .replace(/\([^)]*\)/g, '')
    .replace(/[/\s.‿]/g, '')
    .replace(/ˑ/g, '');
  const out = [];
  const schwa = new Set(); // indices of vowels printed ə: never stressed, not even as the only vowel (the weak form of a /ə/)
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
        const r = BEFORE_R[k] && s[i + k.length] === 'r';
        const [first, second] = (r ? BEFORE_R[k] : v).split(' ');
        if (k === 'ə') schwa.add(out.length);
        // ə is always reduced; any other unmarked vowel is unstressed (fixed below for one-syllable words)
        out.push(first + (k === 'ə' ? '0' : (stress ?? '0')));
        if (second) out.push(second === 'R' ? 'R' : second + '0');
        stress = null;
        i += k.length + (r && BEFORE_R[k].endsWith('ER') ? 1 : 0); // fire /ˈfaɪə(r)/ = AY1 ER0: the r is in the ER
        continue;
      } else out.push(v);
      i += k.length;
    }
  }
  // tidy the r: ə + r = ER0, ɜː + r = ER, a vowel+R token followed by the printed (r) keeps one R
  for (let i = 0; i < out.length - 1; i++) {
    if (out[i + 1] !== 'R') continue;
    if (out[i] === 'AH0' && schwa.has(i)) out[i] = 'ER0';
    else if (!(/^ER\d$/.test(out[i]) || out[i] === 'R')) continue;
    out.splice(i + 1, 1);
    for (const j of [...schwa].filter((j) => j > i).sort((a, b) => a - b)) schwa.delete(j), schwa.add(j - 1);
  }
  const vowels = out.map((p, i) => (/\d$/.test(p) ? i : -1)).filter((i) => i >= 0);
  if (vowels.length === 1 && !schwa.has(vowels[0])) out[vowels[0]] = out[vowels[0]].replace(/\d$/, '1');
  return out;
}

const isVowel = (p) => /\d$/.test(p);
const base = (p) => p.replace(/\d$/, '');
const stressOf = (p) => p.at(-1);
/** how different two phones are: the printed stress matters most */
function subCost(a, b) {
  if (a === b) return 0;
  if ((a === 'R' && /^ER/.test(b)) || (b === 'R' && /^ER/.test(a))) return 0.3; // power: AW1 ER0 ~ AW1 R
  if (isVowel(a) && isVowel(b)) {
    const sa = stressOf(a) !== '0';
    const sb = stressOf(b) !== '0';
    if (sa !== sb) return 1.5; // stress on a different syllable: the adult / affect case
    if (base(a) === base(b)) return 0.2; // primary vs secondary
    return sa ? 1 : 0.6;
  }
  return isVowel(a) || isVowel(b) ? 2 : 1;
}
const indel = (p) => (p === 'R' || p === 'Y' ? 0.3 : isVowel(p) ? 1.2 : 1); // British IPA drops the r that US CMU keeps; /djuː/ ~ D UW
/** edit-distance alignment: [cost, pairs [a|null, b|null]] */
function align(a, b) {
  const d = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) d[i][0] = d[i - 1][0] + indel(a[i - 1]);
  for (let j = 1; j <= b.length; j++) d[0][j] = d[0][j - 1] + indel(b[j - 1]);
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + indel(a[i - 1]), d[i][j - 1] + indel(b[j - 1]), d[i - 1][j - 1] + subCost(a[i - 1], b[j - 1]));
  const pairs = [];
  for (let i = a.length, j = b.length; i > 0 || j > 0; ) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + subCost(a[i - 1], b[j - 1])) pairs.unshift([a[--i], b[--j]]);
    else if (i > 0 && d[i][j] === d[i - 1][j] + indel(a[i - 1])) pairs.unshift([a[--i], null]);
    else pairs.unshift([null, b[--j]]);
  }
  return [d[a.length][b.length], pairs];
}
const distance = (a, b) => align(a, b)[0];
/** ARPAbet for the voice: OH (printed ɒ) is AA */
export const toCmu = (phones) => phones.map((p) => p.replace(/^OH/, 'AA')).join(' ');

/** vowel qualities a dictionary (US) vowel may have for a printed (British) one */
const SAME_VOWEL = {
  IY: ['IY'], IH: ['IH'], EH: ['EH'], AE: ['AE'], AH: ['AH'], AA: ['AA'], OH: ['AA', 'AO'] /* ɒ ~ US AA / AO; ɑː stays ɑː: bath words are not US æ, aunt is not AO */, AO: ['AO', 'AA'], UH: ['UH'], UW: ['UW'],
  ER: ['ER'], OW: ['OW'], EY: ['EY'], AY: ['AY'], OY: ['OY'], AW: ['AW'],
};
/** unstressed: reduced vowels vary between dictionaries, but a full vowel is not a schwa (conduct /kən-/ ≠ K AA0 N) */
const SAME_WEAK = { OH: ['AA', 'AO', 'AH'], AH: ['AH', 'ER', 'IH'], IH: ['IH', 'AH', 'IY'], IY: ['IY', 'IH'], UW: ['UW', 'UH', 'AH'], UH: ['UH', 'UW', 'AH'], ER: ['ER', 'AH'] };

/** may a dictionary vowel stand for a printed one? */
function sameVowel(p, c) {
  const ps = stressOf(p);
  const cs = stressOf(c);
  if (ps === '1' && cs !== '1') return false;
  if (ps === '0' && cs === '1') return false;
  const ok = (ps === '0' ? SAME_WEAK[base(p)] ?? SAME_VOWEL[base(p)] : SAME_VOWEL[base(p)]) ?? [base(p)];
  return ok.includes(base(c));
}

/** The printed pronunciation, spelt with the nearest dictionary pronunciation's American r: the printed vowels and stress
 *  are kept, the dictionary's r is added only where the print simply leaves it out (nearly /ˈnɪəli/ → N IH1 R L IY0,
 *  hardworking /ˌhɑːdˈwɜːkɪŋ/ → HH AA2 R D W ER1…). Used when no dictionary pronunciation agrees with the print. */
export function merge(printed, dict) {
  const [, pairs] = align(printed, dict);
  const out = [];
  for (const [k, [p, c]] of pairs.entries()) {
    if (p && c) {
      // the dictionary's (US) vowel when it may stand for the printed one, with the printed stress
      if (isVowel(p) && isVowel(c)) out.push(sameVowel(p, c) ? base(c) + stressOf(p) : p);
      else if (c === 'R' && p === 'AH0') out.push('ER0');
      else out.push(p);
    } else if (p) out.push(p);
    else if (c === 'R') {
      // the dictionary's r after a vowel (not one starting a syllable, which the print would show)
      const next = pairs.slice(k + 1).find(([, n]) => n)?.[1];
      if (!(next && isVowel(next))) out.push('R');
    }
  }
  for (let i = 0; i < out.length - 2; i++) {
    const [a, b, c] = out.slice(i, i + 3);
    const r = (b === 'AH0' && c === 'R') || (b === 'R' && c === 'AH0');
    // a centring diphthong the print writes without r (nearly /ˈnɪəli/): the vowel + R, as the dictionary does
    if (r && /^(IY|EH|UH)\d$/.test(a)) out.splice(i, 3, a.replace(/^IY/, 'IH'), 'R');
    // fireman /ˈfaɪəmən/: AY1 ER0
    else if (r && /^(AY|AW)\d$/.test(a)) out.splice(i, 3, a, 'ER0');
  }
  for (let i = 0; i < out.length - 1; i++) if (/^ER\d$/.test(out[i]) && out[i + 1] === 'R') out.splice(i + 1, 1);
  return out;
}

/** does a dictionary pronunciation say what the printed IPA says? */
export function agrees(printed, dict) {
  const [, pairs] = align(printed, dict);
  const cAt = (k) => pairs[k]?.[1] ?? null;
  for (const [k, [p, c]] of pairs.entries()) {
    if (p && c && isVowel(p) && isVowel(c)) {
      if (!sameVowel(p, c)) return false;
    } else if (p && c) {
      if (isVowel(p) || isVowel(c)) {
        if (!((p === 'R' && /^ER/.test(c)) || (c === 'R' && /^ER/.test(p)))) return false;
      } else if (p !== c) return false;
    } else if (p) {
      // a printed sound the dictionary does not say: only an r the dictionary's ER already carries (direction /dəˈrekʃn/ ~
      // D ER0 EH1…), or the j of /djuː/
      if (p === 'R' ? !/^ER/.test(cAt(k - 1) ?? '') && !/^ER/.test(cAt(k + 1) ?? '') : p !== 'Y') return false;
    } else if (c) {
      // the dictionary says more: the r British IPA leaves out (after a vowel, not before one), /djuː/'s j, or the schwa of
      // a syllabic l / n / m (Britain /ˈbrɪtn/ ~ B R IH1 T AH0 N)
      const next = cAt(k + 1);
      if (c === 'R') {
        if (next && isVowel(next)) return false;
      } else if (c === 'Y') continue;
      else if (!(isVowel(c) && stressOf(c) === '0' && ['AH', 'IH'].includes(base(c)) && ['L', 'N', 'M'].includes(next))) return false;
    }
  }
  return true;
}

/** "a (an)" → [a, an]; "toward(s)" → [toward, towards]; "although / though"; "AI (= artificial intelligence)" → [AI] */
export function variants(headword) {
  const h = headword.replace(/\(\s*=[^)]*\)/g, '').trim();
  const out = [];
  for (const part of h.split(/\s*\/\s*|\s*[(),]\s*/).filter(Boolean)) out.push(part);
  // a parenthesis glued to a word is an optional ending: toward(s), instal(l), manner(s)
  const glued = /^([A-Za-z'’-]+)\(([A-Za-z]+)\)$/.exec(h);
  if (glued) return [glued[1], glued[1] + glued[2]];
  return out;
}

function main() {
  const lexicon = process.argv[2];
  if (!lexicon) {
    console.error('usage: node scripts/lexicon-pron.mjs <lexicon>');
    process.exit(1);
  }
  const dictFile = '.work/cmudict.dict';
  if (!existsSync(dictFile)) {
    console.error(`${dictFile} missing: curl -L -o ${dictFile} https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict`);
    process.exit(1);
  }
  mkdirSync('.work', { recursive: true });
  /** word → its pronunciations, each an array of ARPAbet phones with stress digits */
  const cmu = new Map();
  for (const line of readFileSync(dictFile, 'utf8').split('\n')) {
    const m = /^([^\s(]+)(?:\(\d+\))?\s+([^#]+)/.exec(line);
    if (!m) continue;
    const w = m[1].toLowerCase();
    if (!cmu.has(w)) cmu.set(w, []);
    cmu.get(w).push(m[2].trim().split(/\s+/));
  }
  const best = (target, vs) => vs.map((v) => ({ v, d: distance(target, v) })).sort((x, y) => x.d - y.d)[0];
  /** the printed pronunciation, as the dictionary writes it when the dictionary agrees */
  const resolve = (printed, word) => {
    const vs = word ? cmu.get(word) ?? [] : [];
    const agreeing = vs.filter((v) => agrees(printed, v));
    if (agreeing.length) return { cmu: best(printed, agreeing).v.join(' '), from: 'cmudict' };
    // no dictionary pronunciation says what the print says: the print, with the nearest one's r (see merge)
    if (vs.length) return { cmu: toCmu(merge(printed, best(printed, vs).v)), from: 'ipa' };
    return { cmu: toCmu(printed), from: 'ipa' };
  };

  const dir = join('content/lexicons', lexicon, 'entries');
  const outFile = join('content/lexicons', lexicon, 'pronunciations.json');
  const previous = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')).entries ?? {} : {};
  const entries = {};
  const review = [];
  const words = (t) => t.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  const plainWord = (t) => /^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(t);
  const counts = { cmudict: 0, ipa: 0, say: 0 };

  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const e = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    if (previous[e.id]?.manual) {
      entries[e.id] = previous[e.id];
      continue;
    }
    if (!e.ipa?.length) continue; // phrases: no printed IPA to follow
    const printedAll = e.ipa.map(ipaToArpa);
    const bad = e.ipa.filter((_, i) => !printedAll[i]);
    if (bad.length) {
      review.push(`${e.id}: IPA ${bad.map((p) => `/${p}/`).join(' ')} not understood — add it by hand ("manual": true)`);
      continue;
    }
    const head = e.headword;
    if (!plainWord(head)) {
      // variants and phrases: say every printed IPA in turn — a (an) → /eɪ/, /ə/ (#131)
      const vs = variants(head);
      const say = printedAll.map((p, i) => {
        const text = (vs.length === printedAll.length ? vs[i] : vs[0]) ?? head;
        return { text, ...resolve(p, plainWord(text) ? text.toLowerCase() : null) };
      });
      const entry = { ipa: e.ipa, say, forms: {} };
      // examples: a single printed pronunciation stands for every one-word variant (colour / color); with several, the
      // weak and strong forms (a /eɪ/ /ə/) depend on the sentence and are left to the voice
      if (printedAll.length === 1)
        for (const v of vs) if (plainWord(v)) entry.forms[v.toLowerCase()] = resolve(printedAll[0], v.toLowerCase()).cmu;
      if (!Object.keys(entry.forms).length) delete entry.forms;
      entries[e.id] = entry;
      counts.say++;
      continue;
    }
    const w = head.toLowerCase();
    const printed = printedAll[0];
    const { cmu: pron, from } = resolve(printed, w);
    counts[from]++;
    if (from === 'ipa' && cmu.has(w))
      review.push(`${e.id}: /${e.ipa[0]}/ ≠ every CMU pronunciation of "${w}" (${cmu.get(w).map((v) => v.join(' ')).join(' | ')}) — using the IPA as printed: ${pron}`);
    const entry = { ipa: e.ipa[0], cmu: pron, from, forms: { [w]: pron } };
    if (e.ipa.length > 1) {
      // two printed pronunciations (abuse n. /əˈbjuːs/, v. /əˈbjuːz/): the word clip uses the first; which one an example
      // uses depends on its meaning
      entry.examples = false;
    } else {
      // the underlined forms in the examples: the dictionary pronunciation nearest the headword's
      const p = pron.split(' ');
      for (const x of e.examples) {
        for (const n of x.en) {
          if (n.t !== 'underline') continue;
          for (const fw of words(n.v ?? '')) {
            if (entry.forms[fw]) continue;
            const vs = cmu.get(fw);
            if (!vs?.length) continue;
            const b = best(p, vs);
            // only forms of this word: share its stressed vowel
            if (b.d <= p.length * 0.6) entry.forms[fw] = b.v.join(' ');
          }
        }
      }
    }
    entries[e.id] = entry;
  }

  // keep the way of saying it that scripts/tts.mjs found agrees with the print ("voice"), while the pronunciation is the same
  for (const [id, e] of Object.entries(entries)) {
    const was = previous[id];
    if (was?.voice && !e.manual && JSON.stringify({ ...was, voice: undefined }) === JSON.stringify({ ...e, voice: undefined })) e.voice = was.voice;
  }
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        note: 'Generated by scripts/lexicon-pron.mjs (#131): the printed IPA as ARPAbet (a CMU pronunciation when it agrees with the print), used by scripts/tts.mjs as SSML <phoneme alphabet="cmu">. "say": headwords that are not one plain word, one pronunciation per printed IPA. Set "manual": true on an entry to keep a hand edit; "voiceText" (with manual) is a respelling the voice reads as printed, where no pin works; "voice" is the way scripts/tts.mjs found that the voice says it as printed.',
        entries,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`${Object.keys(entries).length} entries → ${outFile} (${counts.cmudict} from CMU agreeing with the print, ${counts.ipa} printed IPA, ${counts.say} variants / phrases)`);
  if (review.length) console.log(`\nprinted IPA used where the dictionary differs (${review.length}) — the check script listens to these:\n  ${review.join('\n  ')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
