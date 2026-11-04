/**
 * Visual regression for a design-system migration (docs/14 §15, stage 7): pixel-diff two folders of screenshots
 * taken of the same screen states before and after a change — e.g. the .work/figma/capture.mjs states captured on a
 * worktree of the base commit and on the working tree.
 *
 *   npx tsx scripts/ds-visual-diff.ts <beforeDir> <afterDir> [diffDir]
 *
 * Prints, per PNG, "identical" or the share of changed pixels and the changed row range; writes a red-on-grey diff
 * image per changed state into diffDir. Every change must be explained (token snapping, a listed intended change) —
 * an unexplained difference is a regression.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

type Png = { width: number; height: number; data: Buffer };
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle') as {
  PNG: { new (o: { width: number; height: number }): Png; sync: { read(b: Buffer): Png; write(p: Png): Buffer } };
};

export function diff(a: Png, b: Png, threshold = 30) {
  if (a.width !== b.width || a.height !== b.height) return { size: true as const };
  const out = new PNG({ width: a.width, height: a.height });
  let n = 0, minY = Infinity, maxY = -1;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (d > threshold) {
      n++;
      out.data.set([255, 0, 0, 255], i);
      const y = Math.floor(i / 4 / a.width);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    } else {
      const g = 255 - (255 - b.data[i]) / 4;
      out.data.set([g, g, g, 255], i);
    }
  }
  return { size: false as const, changed: n, share: n / (a.width * a.height), rows: [minY, maxY] as const, image: out };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [before, after, outDir = 'diff'] = process.argv.slice(2);
  if (!before || !after) { console.error('usage: ds-visual-diff <beforeDir> <afterDir> [diffDir]'); process.exit(2); }
  mkdirSync(outDir, { recursive: true });
  let changed = 0;
  for (const f of readdirSync(before).filter((x) => x.endsWith('.png')).sort((x, y) => x.localeCompare(y, 'en', { numeric: true }))) {
    if (!existsSync(join(after, f))) { console.log(`${f.padEnd(12)} missing after`); changed++; continue; }
    const r = diff(PNG.sync.read(readFileSync(join(before, f))), PNG.sync.read(readFileSync(join(after, f))));
    if (r.size) { console.log(`${f.padEnd(12)} size differs`); changed++; continue; }
    if (!r.changed) { console.log(`${f.padEnd(12)} identical`); continue; }
    changed++;
    writeFileSync(join(outDir, f), PNG.sync.write(r.image));
    console.log(`${f.padEnd(12)} ${(r.share * 100).toFixed(2)}% px  rows ${r.rows[0]}–${r.rows[1]}`);
  }
  console.log(`${changed} state(s) changed`);
}
