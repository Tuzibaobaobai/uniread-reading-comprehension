// Generate the examiner's lines of speaking papers as audio with Volcano Engine TTS (HTTP V1, non-streaming).
//   node scripts/tts.mjs <playlist> [--voice en_female_amanda_mars_bigtts] [--partner-voice en_male_adam_mars_bigtts] [--speed 1.0] [--force]
//   node scripts/tts.mjs --lexicon <lexicon> [--voice …] [--jobs 4] [--force]   词汇天天练 (#110): every entry's headword and examples →
//     content/assets/lexicons/<lx>/<entryId>.mp3 and <entryId>-x<N>.mp3, set as entry.audio. Standard (#131): a word is
//     said as the book's IPA prints it — the headword and its forms in the examples go to the voice as SSML
//     <phoneme alphabet="cmu"> from content/lexicons/<lx>/pronunciations.json (scripts/lexicon-pron.mjs; run it first);
//     a headword with variants — a (an) — or with more than one printed IPA — object — says each printed IPA in turn. Then check what the clips say with
//     scripts/check-pron-audio.mjs.
//     A clip is made again whenever what is sent for it changes (.work/tts/<lx>.json remembers what each clip was made from).
// Credentials: VOLC_TTS_APPID / VOLC_TTS_TOKEN in .env.local (never committed). Writes
// content/assets/<pl>/<itemId>-<qid>-<turnId>.mp3 (gitignored, shipped in rc-media-<pl>.zip) and sets
// turn.audio {src, seconds} in the items. Existing files are kept unless --force (re-generation costs characters).
// Docs: https://docs.volcengine.com/docs/DoubaoVoice/HTTPone-timecompositenon-streaminginterface-V1notrecommended
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const lexicon = args.includes('--lexicon') ? args[args.indexOf('--lexicon') + 1] : null;
const pl = lexicon ?? args.find((a) => !a.startsWith('--'));
const opt = (name, fallback) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback);
const voice = opt('voice', 'en_female_amanda_mars_bigtts'); // US English, calm and formal (teacher-examiner)
const partnerVoice = opt('partner-voice', 'en_male_adam_mars_bigtts'); // US English male: the AI partner in PET Part 3
const speed = Number(opt('speed', '1.0'));
const force = args.includes('--force');
if (!pl) {
  console.error('usage: node scripts/tts.mjs <playlist> [--voice <voice_type>] [--speed 1.0] [--force]');
  process.exit(1);
}
const env = Object.fromEntries(
  (existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '')
    .split('\n')
    .map((l) => /^([A-Z_]+)="?(.*?)"?$/.exec(l.trim()))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const appid = process.env.VOLC_TTS_APPID ?? env.VOLC_TTS_APPID;
const token = process.env.VOLC_TTS_TOKEN ?? env.VOLC_TTS_TOKEN;
if (!appid || !token) {
  console.error('VOLC_TTS_APPID / VOLC_TTS_TOKEN missing (.env.local)');
  process.exit(1);
}

async function synthesize(text, voiceType, ssml = false, encoding = 'mp3') {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer;${token}` },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        app: { appid, token: 'uniread-rc', cluster: 'volcano_tts' },
        user: { uid: 'uniread-rc' },
        audio: { voice_type: voiceType, encoding, bitrate: 64, speed_ratio: speed, explicit_language: 'en' },
        request: { reqid: randomUUID(), text, operation: 'query', ...(ssml ? { text_type: 'ssml' } : {}) },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (body.code === 3000 && body.data) return Buffer.from(body.data, 'base64');
    // 3003 concurrency / 3005 busy / 3040 link error: retry a few times
    if (attempt < 4 && [3003, 3005, 3031, 3040, 3030, 3032].includes(body.code)) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      continue;
    }
    throw new Error(`tts ${res.status} ${body.code}: ${body.message ?? ''} (logid ${res.headers.get('x-tt-logid')})`);
  }
}

/** a clip's audio: one request, or — for a word said several ways (sent.parts) — one request per part, joined */
async function render(sent) {
  if (!sent.parts) return synthesize(sent.text, voice, sent.ssml);
  const dir = join(tmpdir(), `rc-tts-${randomUUID()}`);
  mkdirSync(dir);
  const wavs = [];
  for (const [i, x] of sent.parts.entries()) {
    wavs.push(join(dir, `${i}.wav`));
    writeFileSync(wavs[i], await synthesize(x.text, voice, x.ssml, 'wav'));
  }
  const out = join(dir, 'joined.mp3');
  execFileSync('.work/venv-pron/bin/python', ['scripts/py/join_audio.py', out, ...wavs]);
  const mp3 = readFileSync(out);
  rmSync(dir, { recursive: true });
  return mp3;
}

let made = 0;
let chars = 0;
const verifyAll = args.includes('--verify-all');
let wordInputFor; // set in the lexicon branch, used by verify()
let manifestOf;
let saveManifestOf;
const seconds = (file) => Math.round(Number(/estimated duration: ([\d.]+)/.exec(execFileSync('afinfo', [file], { encoding: 'utf8' }))[1]) * 10) / 10;

if (lexicon) {
  /** said as words: sb. / sth. / one's are reading abbreviations */
  const spoken = (t) => t.replace(/\bsb\./g, 'somebody').replace(/\bsth\./g, 'something').replace(/\s+/g, ' ').trim();
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const dirL = join('content/lexicons', lexicon, 'entries');
  const pronFile = join('content/lexicons', lexicon, 'pronunciations.json');
  if (!existsSync(pronFile)) {
    console.error(`${pronFile} missing: run node scripts/lexicon-pron.mjs ${lexicon} first (#131)`);
    process.exit(1);
  }
  const prons = JSON.parse(readFileSync(pronFile, 'utf8')).entries;
  const manifestFile = join('.work/tts', `${lexicon}.json`);
  const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
  mkdirSync(join('content/assets/lexicons', lexicon), { recursive: true });
  /** A pinned pronunciation as this voice needs it (#131, measured with scripts/check-pron-audio.mjs):
   *  - ə: CMU writes AH0, but the voice says AH0 as a full vowel (affect /əˈfekt/ came out /ˈæfekt/, every time) and maps
   *    a phone string that is a dictionary pronunciation back to the word's own default. AX is the schwa it honours.
   *  - a lone ə (a /ə/): any one-vowel pin is stressed, and a stressed schwa comes out /eɪ/ — said as "uh" instead. */
  //  The voice's phoneme support is approximate (it weighs the pin against what it knows of the word), so every headword
  //  clip is then checked with a phoneme recogniser and, if it says something else, made again another way (see verify).
  const voicePhones = (cmu, mode = 'ax') => (mode === 'cmu' ? cmu : cmu.split(' ').map((p) => (p === 'AH0' ? 'AX' : p)).join(' '));
  const phoneme = (cmu, text, mode = 'ax') =>
    cmu === 'AH0' && mode === 'ax' ? 'uh' : `<phoneme alphabet="cmu" ph="${voicePhones(cmu, mode)}">${esc(text)}</phoneme>`;
  /** the text sent for a clip: plain, or SSML with the entry's words pinned to their printed pronunciation */
  const input = (text, forms) => {
    let pinned = false;
    const out = spoken(text)
      .split(/([A-Za-z]+(?:'[A-Za-z]+)?)/)
      .map((part, i) => {
        const ph = i % 2 ? forms?.[part.toLowerCase()] : undefined;
        if (!ph) return esc(part);
        pinned = true;
        return phoneme(ph, part);
      })
      .join('');
    return pinned ? { text: `<speak>${out}</speak>`, ssml: true } : { text: spoken(text), ssml: false };
  };
  /** a headword with more than one printed IPA — object /əbˈdʒekt/ /ˈɒbdʒɪkt/, a (an), although / though: each printed
   *  IPA in turn. Each is synthesised on its own and the parts joined (scripts/py/join_audio.py): in one request the voice
   *  says a spelling one way only — "either, either" pinned /ˈaɪðə/ then /ˈiːðə/ comes out /ˈaɪðə/ twice (#131). */
  const sayAll = (say, mode) => {
    const parts = say.map((x) =>
      x.voiceText ? { text: x.voiceText, ssml: false }
      : mode === 'plain' ? { text: spoken(x.text), ssml: false }
      : { text: `<speak>${phoneme(x.cmu, x.text, mode)}</speak>`, ssml: true },
    );
    return { parts, text: parts.map((x) => x.text).join(' | ') };
  };
  /** the headword clip's input. mode: "ax" (default, the pin with AX for ə), "cmu" (the pin as CMU writes it), "plain" (the
   *  voice's own reading) — the verify step records in pronunciations.json ("voice") the mode that says the printed IPA */
  const wordInput = (entry, p, mode = p?.voice ?? 'ax') => {
    // a respelling the voice reads as printed (the /ðiː/ → "thee"), set by hand ("manual": true) where no pin works
    if (p?.voiceText) return { text: p.voiceText, ssml: false };
    if (p?.say) return sayAll(p.say, mode);
    if (mode === 'plain' || !p) return { text: spoken(entry.headword), ssml: false };
    return { text: `<speak>${phoneme(p.cmu, entry.headword, mode)}</speak>`, ssml: true };
  };
  const madeWords = [];
  const madeSrc = new Set();
  wordInputFor = wordInput;
  manifestOf = manifest;
  saveManifestOf = () => writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  const clip = async (src, text, forms, sentFor) => {
    const file = join('content', src);
    const sent = sentFor ?? input(text, forms);
    // clips made before #131 have no manifest line: they were made from the plain text
    if (force || !existsSync(file) || (manifest[src] ?? spoken(text)) !== sent.text) {
      writeFileSync(file, await render(sent));
      made++;
      madeSrc.add(src);
      chars += sent.text.length;
    }
    manifest[src] = sent.text;
    return { src, seconds: seconds(file) };
  };
  mkdirSync('.work/tts', { recursive: true });
  const saveManifest = () => writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  const failed = [];
  const doEntry = async (f) => {
    try {
      await makeEntry(f);
    } catch (e) {
      // one bad clip (e.g. 3031 engine process fail on a particular text) must not stop a whole book: report it at the end
      failed.push(`${f}: ${e.message}`);
    }
  };
  const makeEntry = async (f) => {
    const path = join(dirL, f);
    const entry = JSON.parse(readFileSync(path, 'utf8'));
    const base = `assets/lexicons/${lexicon}/${entry.id}`;
    const p = prons[entry.id];
    const audio = { word: await clip(`${base}.mp3`, entry.headword, undefined, wordInput(entry, p)) };
    if (p && (madeSrc.has(audio.word.src) || verifyAll)) madeWords.push({ entry, p, src: audio.word.src, path });
    if (entry.examples.length) {
      audio.examples = [];
      for (const [i, x] of entry.examples.entries())
        audio.examples.push(await clip(`${base}-x${i + 1}.mp3`, x.en.map((n) => n.v ?? '').join(''), p?.examples === false ? undefined : p?.forms));
    }
    if (JSON.stringify(entry.audio) !== JSON.stringify(audio)) {
      // keep the field order of the schema: audio before errata / source
      const { errata, source, status, ...rest } = entry;
      writeFileSync(path, JSON.stringify({ ...rest, audio, ...(errata ? { errata } : {}), source, status }, null, 2) + '\n');
    }
  };
  // a whole book is ~5–10k clips: a few entries at a time (--jobs, default 4), the manifest saved as it goes so a stop loses nothing
  const queue = readdirSync(dirL).filter((f) => f.endsWith('.json')).sort();
  const total = queue.length;
  let done = 0;
  await Promise.all(
    Array.from({ length: Number(opt('jobs', '4')) }, async () => {
      for (let f; (f = queue.shift()); ) {
        await doEntry(f);
        if (++done % 50 === 0) {
          saveManifest();
          console.log(`${done}/${total} entries, ${made} clip(s) made`);
        }
      }
    }),
  );
  saveManifest();
  if (failed.length) console.log(`${failed.length} entr${failed.length === 1 ? 'y' : 'ies'} failed (audio unchanged):\n  ${failed.join('\n  ')}`);
  console.log(`${made} clip(s) synthesised (${chars} characters, ${voice}, speed ${speed}); entries updated`);
  if (!args.includes('--no-verify')) await verify(madeWords);
  process.exit(0);
}

/** Headword clips (#131): does the recording say the printed IPA? A phoneme recogniser checks the vowels of each clip made
 *  in this run (--verify-all: every pinned headword); one that says something else is made the other ways in turn (cmu,
 *  plain, ax) and the first that agrees is kept, its mode recorded as "voice" in pronunciations.json. Those no way gets
 *  right are listed in .work/tts/<lx>-unverified.json for a person to listen to. */
async function verify(words) {
  const { compare, recognise, recogniserReady } = await import('./lib/pron-check.mjs');
  if (!recogniserReady()) {
    console.log('headword clips NOT verified: phoneme recogniser not set up (see scripts/lib/pron-check.mjs)');
    return;
  }
  const expected = (p) => (p.say ? p.say.map((x) => x.cmu) : [p.cmu]);
  const files = (ws) => ws.map((w) => join('content', w.src));
  console.log(`verifying ${words.length} headword clip(s)…`);
  const heard = await recognise(files(words));
  let bad = words.filter((w) => {
    w.heard = heard.get(join('content', w.src)) ?? '';
    w.problems = compare(expected(w.p), w.heard);
    return w.problems.length;
  });
  console.log(`${words.length - bad.length} agree with the printed IPA, ${bad.length} do not — trying other ways`);
  const pronFile = join('content/lexicons', lexicon, 'pronunciations.json');
  const pronDoc = JSON.parse(readFileSync(pronFile, 'utf8'));
  mkdirSync('.work/tts/try', { recursive: true });
  let fixed = 0;
  for (const mode of ['cmu', 'plain', 'ax']) {
    // the voice's own reading of one word twice cannot say two pronunciations (object, object)
    const repeats = (w) => w.p.say && new Set(w.p.say.map((x) => x.voiceText ?? x.text.toLowerCase())).size < w.p.say.length;
    const tries = bad.filter((w) => (w.p.voice ?? 'ax') !== mode && !(w.tried ??= new Set()).has(mode) && !(mode === 'plain' && repeats(w)));
    if (!tries.length) continue;
    for (const w of tries) {
      w.tried.add(mode);
      w.sent = wordInputFor(w.entry, w.p, mode);
      w.tryFile = join('.work/tts/try', `${w.entry.id}-${mode}.mp3`);
      try {
        writeFileSync(w.tryFile, await render(w.sent));
        made++;
        chars += w.sent.text.length;
      } catch {
        w.tryFile = null;
      }
    }
    const got = await recognise(tries.filter((w) => w.tryFile).map((w) => w.tryFile));
    for (const w of tries) {
      if (!w.tryFile || compare(expected(w.p), got.get(w.tryFile) ?? '').length) continue;
      // this way says the printed IPA: keep it
      const file = join('content', w.src);
      writeFileSync(file, readFileSync(w.tryFile));
      manifestOf[w.src] = w.sent.text;
      if (mode === 'ax') delete pronDoc.entries[w.entry.id].voice;
      else pronDoc.entries[w.entry.id].voice = mode;
      const entry = JSON.parse(readFileSync(w.path, 'utf8'));
      entry.audio.word.seconds = seconds(file);
      writeFileSync(w.path, JSON.stringify(entry, null, 2) + '\n');
      w.ok = true;
      fixed++;
    }
    bad = bad.filter((w) => !w.ok);
  }
  writeFileSync(pronFile, JSON.stringify(pronDoc, null, 2) + '\n');
  saveManifestOf();
  const out = join('.work/tts', `${lexicon}-unverified.json`);
  writeFileSync(
    out,
    JSON.stringify(bad.map((w) => ({ id: w.entry.id, headword: w.entry.headword, ipa: w.entry.ipa, expected: expected(w.p), heard: w.heard, problems: w.problems })), null, 2) + '\n',
  );
  console.log(`${fixed} made again another way; ${bad.length} still differ (kept as made, a person should listen) → ${out}`);
}

const dir = join('content/playlists', pl, 'items');
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const path = join(dir, f);
  const raw = readFileSync(path, 'utf8');
  const item = JSON.parse(raw);
  let changed = false;
  for (const s of item.sections)
    for (const q of s.questions) {
      if (q.interaction.kind !== 'speaking') continue;
      for (const t of q.interaction.turns) {
        const src = `assets/${pl}/${item.id}-${q.id}-${t.id}.mp3`;
        const file = join('content', src);
        if (force || !existsSync(file)) {
          writeFileSync(file, await synthesize(t.text, t.role === 'partner' ? partnerVoice : voice));
          made++;
          chars += t.text.length;
        }
        const secs = seconds(file);
        if (t.audio?.src !== src || t.audio?.seconds !== secs) {
          t.audio = { src, seconds: secs };
          changed = true;
        }
      }
    }
  if (changed) writeFileSync(path, JSON.stringify(item, null, 2) + '\n');
}
console.log(`${made} line(s) synthesised (${chars} characters, examiner ${voice}, partner ${partnerVoice}, speed ${speed}); items updated`);
