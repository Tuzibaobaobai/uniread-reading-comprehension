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

/** all text of an item's passage — answers quoted verbatim from the public article are not leaks */
async function passageText(keyFile: string): Promise<string> {
  try {
    const item = JSON.parse(await readFile(keyFile.replace('/keys/', '/items/'), 'utf8')) as { article?: unknown };
    const out: string[] = [];
    const walk = (o: unknown) => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => (k === 'v' && typeof v === 'string' ? out.push(v) : walk(v)));
    };
    walk(item.article);
    return out.join(' ');
  } catch {
    return '';
  }
}

export async function findLeaks(publicDir: string, keyGlob = 'content/playlists/*/keys/*.json'): Promise<string[]> {
  const needles: { needle: string; key: string }[] = [];
  for await (const f of glob(keyGlob)) {
    const key = JSON.parse(await readFile(f, 'utf8')) as ItemKeyT;
    const passage = (await passageText(f)).replace(/\s+/g, ' ');
    privateNeedles(key)
      .filter((needle) => !passage.includes(needle.replace(/\s+/g, ' ')))
      .forEach((needle) => needles.push({ needle, key: f }));
  }
  const leaks: string[] = [];
  for await (const f of glob(`${publicDir}/**/*.{js,mjs,html,json,css,txt,map}`)) {
    const text = await readFile(f, 'utf8');
    for (const n of needles) if (text.includes(n.needle)) leaks.push(`${f} contains text from ${n.key}: “${n.needle}”`);
  }
  return leaks;
}
