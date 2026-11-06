// Azure Speech TTS (#131): the second engine of the 词汇天天练 audio, for what the Volcano voice cannot say as printed —
// one-syllable weak forms (a /ə/, and /ən/, them /ðəm/) and a weak first syllable before the stress (object /əbˈdʒekt/).
// Azure's en-US neural voices take <phoneme alphabet="ipa"> and honour a reduced ə. Used by scripts/tts.mjs --lexicon.
// Credentials: AZURE_SPEECH_KEY / AZURE_SPEECH_REGION in .env.local (never committed).

/** ARPAbet (pronunciations.json) → the en-US IPA Azure's phone set takes; the primary / secondary stress mark goes before
 *  the stressed syllable's onset. */
const V = {
  AA: 'ɑ',
  OH: 'ɑ',
  AE: 'æ',
  AH: 'ʌ',
  AO: 'ɔ',
  AW: 'aʊ',
  AX: 'ə',
  AY: 'aɪ',
  EH: 'ɛ',
  ER: 'ɝ',
  EY: 'eɪ',
  IH: 'ɪ',
  IY: 'i',
  OW: 'oʊ',
  OY: 'ɔɪ',
  UH: 'ʊ',
  UW: 'u',
};
const C = {
  B: 'b',
  CH: 'tʃ',
  D: 'd',
  DH: 'ð',
  F: 'f',
  G: 'ɡ',
  HH: 'h',
  JH: 'dʒ',
  K: 'k',
  L: 'l',
  M: 'm',
  N: 'n',
  NG: 'ŋ',
  P: 'p',
  R: 'ɹ',
  S: 's',
  SH: 'ʃ',
  T: 't',
  TH: 'θ',
  V: 'v',
  W: 'w',
  Y: 'j',
  Z: 'z',
  ZH: 'ʒ',
};
// two- and three-consonant onsets English allows (the stress mark goes before the whole onset)
const ONSETS = new Set(
  'P R|T R|K R|B R|D R|G R|F R|TH R|SH R|P L|K L|B L|G L|F L|S L|S P|S T|S K|S M|S N|S W|T W|K W|D W|S P R|S T R|S K R|S P L|S K W|P Y|B Y|K Y|F Y|M Y|HH Y|V Y'.split(
    '|',
  ),
);
export function arpaToIpa(cmu) {
  const ph = cmu.split(' ');
  const out = ph.map((p) => {
    const m = /^([A-Z]+)(\d)?$/.exec(p);
    if (!m) throw new Error(`unknown phone ${p}`);
    const [, b, st] = m;
    if (V[b]) return b === 'AH' && st === '0' ? 'ə' : b === 'ER' && st === '0' ? 'ɚ' : V[b];
    if (C[b]) return C[b];
    throw new Error(`unknown phone ${p}`);
  });
  // stress marks, from the last phone back so indices stay valid
  for (let i = ph.length - 1; i >= 0; i--) {
    const st = /(\d)$/.exec(ph[i])?.[1];
    if (st !== '1' && st !== '2') continue;
    let start = i;
    // take the longest legal onset of consonants before the vowel (never the first consonant of a word-final coda)
    for (let k = 3; k >= 1; k--) {
      const cons = ph.slice(i - k, i);
      if (i - k < 0 || cons.some((p) => /\d$/.test(p))) continue;
      if (k === 1 || ONSETS.has(cons.join(' '))) {
        start = i - k;
        break;
      }
    }
    // a lone vowel or a word-initial consonant: the mark goes first anyway
    out.splice(start, 0, st === '1' ? 'ˈ' : 'ˌ');
  }
  return out.join('');
}

export function azureReady(env) {
  return Boolean(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION);
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** the SSML body for one pronunciation: the IPA pinned on the word, or plain text */
export const azurePart = (x) =>
  x.voiceText ? esc(x.voiceText) : `<phoneme alphabet="ipa" ph="${arpaToIpa(x.cmu)}">${esc(x.text)}</phoneme>`;

/** one utterance → 24 kHz 16-bit mono WAV */
export async function azureSynthesize(body, voiceName, env) {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${voiceName}">${body}</voice></speak>`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
        'User-Agent': 'uniread-rc',
      },
      signal: AbortSignal.timeout(30000),
      body: ssml,
    }).catch((e) => {
      if (attempt < 8 && e.name === 'TimeoutError') return null; // a slow answer: ask again
      throw e;
    });
    if (!res) continue;
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    // the free tier (F0) allows 20 requests a minute: wait as told and try again
    if (attempt < 8 && [429, 500, 502, 503].includes(res.status)) {
      const after = Number(res.headers.get('retry-after')) || 3 * attempt;
      await new Promise((r) => setTimeout(r, after * 1000));
      continue;
    }
    throw new Error(`azure tts ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}
