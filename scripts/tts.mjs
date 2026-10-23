// Generate the examiner's lines of speaking papers as audio with Volcano Engine TTS (HTTP V1, non-streaming).
//   node scripts/tts.mjs <playlist> [--voice en_female_amanda_mars_bigtts] [--partner-voice en_male_adam_mars_bigtts] [--speed 1.0] [--force]
//   node scripts/tts.mjs --lexicon <lexicon> [--voice …] [--force]   词汇天天练 (#110): every entry's headword and examples →
//     content/assets/lexicons/<lx>/<entryId>.mp3 and <entryId>-x<N>.mp3, set as entry.audio
// Credentials: VOLC_TTS_APPID / VOLC_TTS_TOKEN in .env.local (never committed). Writes
// content/assets/<pl>/<itemId>-<qid>-<turnId>.mp3 (gitignored, shipped in rc-media-<pl>.zip) and sets
// turn.audio {src, seconds} in the items. Existing files are kept unless --force (re-generation costs characters).
// Docs: https://docs.volcengine.com/docs/DoubaoVoice/HTTPone-timecompositenon-streaminginterface-V1notrecommended
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

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

async function synthesize(text, voiceType) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer;${token}` },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        app: { appid, token: 'uniread-rc', cluster: 'volcano_tts' },
        user: { uid: 'uniread-rc' },
        audio: { voice_type: voiceType, encoding: 'mp3', bitrate: 64, speed_ratio: speed, explicit_language: 'en' },
        request: { reqid: randomUUID(), text, operation: 'query' },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (body.code === 3000 && body.data) return Buffer.from(body.data, 'base64');
    // 3003 concurrency / 3005 busy / 3040 link error: retry a few times
    if (attempt < 4 && [3003, 3005, 3040, 3030, 3032].includes(body.code)) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      continue;
    }
    throw new Error(`tts ${res.status} ${body.code}: ${body.message ?? ''} (logid ${res.headers.get('x-tt-logid')})`);
  }
}

let made = 0;
let chars = 0;
const seconds = (file) => Math.round(Number(/estimated duration: ([\d.]+)/.exec(execFileSync('afinfo', [file], { encoding: 'utf8' }))[1]) * 10) / 10;

if (lexicon) {
  /** said as words: sb. / sth. / one's are reading abbreviations */
  const spoken = (t) => t.replace(/\bsb\./g, 'somebody').replace(/\bsth\./g, 'something').replace(/\s+/g, ' ').trim();
  const dirL = join('content/lexicons', lexicon, 'entries');
  mkdirSync(join('content/assets/lexicons', lexicon), { recursive: true });
  const clip = async (src, text) => {
    const file = join('content', src);
    if (force || !existsSync(file)) {
      writeFileSync(file, await synthesize(spoken(text), voice));
      made++;
      chars += text.length;
    }
    return { src, seconds: seconds(file) };
  };
  for (const f of readdirSync(dirL).filter((f) => f.endsWith('.json')).sort()) {
    const path = join(dirL, f);
    const entry = JSON.parse(readFileSync(path, 'utf8'));
    const base = `assets/lexicons/${lexicon}/${entry.id}`;
    const audio = { word: await clip(`${base}.mp3`, entry.headword) };
    if (entry.examples.length) {
      audio.examples = [];
      for (const [i, x] of entry.examples.entries()) audio.examples.push(await clip(`${base}-x${i + 1}.mp3`, x.en.map((n) => n.v ?? '').join('')));
    }
    if (JSON.stringify(entry.audio) !== JSON.stringify(audio)) {
      // keep the field order of the schema: audio before errata / source
      const { errata, source, status, ...rest } = entry;
      writeFileSync(path, JSON.stringify({ ...rest, audio, ...(errata ? { errata } : {}), source, status }, null, 2) + '\n');
    }
  }
  console.log(`${made} clip(s) synthesised (${chars} characters, ${voice}, speed ${speed}); entries updated`);
  process.exit(0);
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
