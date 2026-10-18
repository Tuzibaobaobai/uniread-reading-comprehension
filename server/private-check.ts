/**
 * Private-material check (docs/14 §5): answers, explanations and rubrics must not appear in the
 * public build. Scans every text file under a directory for distinctive strings taken from the keys.
 */
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { AnswerKeyT, ItemKeyT } from '@schema';

/** distinctive private strings from one key (explanations, tips, reference answers, key-point notes) */
export function privateNeedles(key: ItemKeyT): string[] {
  const out: string[] = [];
  const add = (s?: string) => s && s.trim().length >= 12 && out.push(s.trim().slice(0, 40));
  Object.values(key.answers).forEach((a: AnswerKeyT) => {
    add(a.explanationZh);
    add(a.tipsZh);
    if ('sampleAnswer' in a) {
      add(a.sampleAnswer);
      add(a.rubricZh);
      a.keyPoints?.forEach((k) => add(k.descZh));
    }
  });
  return out;
}

export async function findLeaks(publicDir: string, keyGlob = 'content/playlists/*/keys/*.json'): Promise<string[]> {
  const needles: { needle: string; key: string }[] = [];
  for await (const f of glob(keyGlob)) {
    const key = JSON.parse(await readFile(f, 'utf8')) as ItemKeyT;
    privateNeedles(key).forEach((needle) => needles.push({ needle, key: f }));
  }
  const leaks: string[] = [];
  for await (const f of glob(`${publicDir}/**/*.{js,mjs,html,json,css,txt,map}`)) {
    const text = await readFile(f, 'utf8');
    for (const n of needles) if (text.includes(n.needle)) leaks.push(`${f} contains text from ${n.key}: “${n.needle}”`);
  }
  return leaks;
}
