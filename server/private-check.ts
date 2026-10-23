/**
 * Private-material check (docs/14 §5): answers, explanations and rubrics must not appear in the
 * public build. Scans every text file under a directory for distinctive strings taken from the keys.
 */
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { AnswerKeyT, BlockT, InlineT, ItemKeyT } from '@schema';

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
  // listening transcripts (exam papers) are revealed only after submitting
  const text = (nodes: InlineT[]) => nodes.map((n) => ('v' in n ? n.v : '')).join('');
  const blockTexts = (b: BlockT): string[] =>
    b.type === 'paragraph' || b.type === 'heading' ? [text(b.content)] : b.type === 'dialogue' ? b.turns.map((t) => text(t.content)) : [];
  Object.values(key.transcripts ?? {}).forEach((blocks) => blocks.flatMap(blockTexts).forEach((s) => add(s)));
  return out;
}

/** all text of an item's passage — answers quoted verbatim from the public article are not leaks */
async function passageText(keyFile: string): Promise<string> {
  try {
    const item = JSON.parse(await readFile(keyFile.replace('/keys/', '/items/'), 'utf8')) as {
      article?: unknown;
      format?: string;
      lexicon?: string;
      entryIds?: string[];
    };
    const out: string[] = [];
    // 词汇天天练 (#110): the day's handbook entries are public (Vocabulary tab) — 中译英 answers are often their examples
    if (item.format === 'vocab-day') {
      const strings = (o: unknown): string[] =>
        typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(strings) : o && typeof o === 'object' ? Object.values(o).flatMap(strings) : [];
      const root = keyFile.slice(0, keyFile.indexOf('/playlists/'));
      for (const id of item.entryIds ?? []) {
        const entry: unknown = JSON.parse(await readFile(`${root}/lexicons/${item.lexicon}/entries/${id}.json`, 'utf8'));
        const ex = (entry as { examples?: { en: { v?: string }[] }[] }).examples ?? [];
        out.push(...strings(entry), ...ex.map((x) => x.en.map((n) => n.v ?? '').join('')));
      }
      return out.join(' ');
    }
    const walk = (o: unknown) => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => (k === 'v' && typeof v === 'string' ? out.push(v) : walk(v)));
    };
    // exam papers: the whole question paper is public (narrator lines often repeat its printed instructions)
    walk(item.format === 'exam' ? item : item.article);
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
  const idOf = (file: string) => /\/(?:items|keys)\/([^/]+)\.json$/.exec(file)?.[1];
  for await (const f of glob(`${publicDir}/**/*.{js,mjs,html,json,css,txt,map}`)) {
    const text = await readFile(f, 'utf8');
    // another item's public file can share an ordinary phrase with a short answer ("tell the difference
    // between"): a key is checked against its own item and every shared file (bundle, catalog), not other items
    const item = idOf(f);
    for (const n of needles) if ((!item || item === idOf(n.key)) && text.includes(n.needle)) leaks.push(`${f} contains text from ${n.key}: “${n.needle}”`);
  }
  return leaks;
}
