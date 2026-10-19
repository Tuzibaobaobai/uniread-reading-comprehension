// Transcode exam audio to 48 kbps mono AAC (.m4a, plenty for speech) with macOS afconvert and print durations.
// Audio is a delivered asset, not source: content/assets/**/*.m4a is gitignored and handed to UniRead as
// rc-media-<playlist>.zip (scripts/make-handoff-release.mjs). Re-run this to regenerate it from articles/.
// usage: node scripts/audio.mjs <srcDir> <outDir> <prefix>
//   finds every "Test N Part K.mp3" under srcDir (any depth) → <outDir>/<prefix>-t<N>-p<K>.m4a
//   writes <outDir>/<prefix>-audio.json: { "t1-p1": seconds, … }
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [src, out, prefix] = process.argv.slice(2);
if (!src || !out || !prefix) {
  console.error('usage: node scripts/audio.mjs <srcDir> <outDir> <prefix>');
  process.exit(1);
}
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
mkdirSync(out, { recursive: true });
const durations = {};
for (const f of walk(src)) {
  const m = /Test (\d+) Part (\d+)\.mp3$/.exec(f);
  if (!m) continue;
  const key = `t${m[1]}-p${m[2]}`;
  if (key in durations) continue;
  const dst = join(out, `${prefix}-${key}.m4a`);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-c', '1', '-b', '48000', '-s', '0', f, dst]);
  const info = execFileSync('afinfo', [dst], { encoding: 'utf8' });
  durations[key] = Math.round(Number(/estimated duration: ([\d.]+)/.exec(info)[1]));
}
const sorted = Object.fromEntries(Object.entries(durations).sort());
writeFileSync(join(out, `${prefix}-audio.json`), JSON.stringify(sorted, null, 2) + '\n');
console.log(`${Object.keys(sorted).length} files → ${out}`, sorted);
