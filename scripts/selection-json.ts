/**
 * Optional machine selection list (docs/14 §3.1, format rc-selection-2) — one file per frozen Selection of ONE Playlist.
 *
 *   npx tsx scripts/selection-json.ts <paperId> "<paper title>" <playlistId> [itemId …]
 *   npx tsx scripts/selection-json.ts --per-section …   legacy mapping, only to reproduce the delivered 时文 selections
 *   → docs/handoff/production-selection.<paperId>.json
 *
 * Logical ids (stable; lowercase letters/digits/hyphens, ≤128; not platform DB ids):
 *   sourceId   uniread-rc
 *   materialId <itemId>-article         one per item; the item's Resource uses it
 *   resourceId <itemId>                 one per Item (#130, agreed with the BE 2026-11-05): KET Reading & Writing, each PET
 *                                       paper, one 时文 day, one 词汇天天练 day is ONE Resource; its Parts / sections
 *                                       stay inside it (sectionIds lists them all, in order) and never get a resourceId
 *   (legacy --per-section: resourceId <itemId>-<sectionId>, one per section — the 时文 selections delivered before
 *   2026-11-05 keep these ids; a new mapping for them is decided with the BE, never by regenerating the frozen files)
 * Resource order = item order (week/day / paper). The format name stays rc-selection-2: the BE parser already accepts
 * several sectionIds per resource, so the item-level mapping needs no new format.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { ItemT, PlaylistT } from '../schema/index.ts';

export const SOURCE_ID = 'uniread-rc';
export const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const materialIdOf = (itemId: string) => `${itemId}-article`;
/** legacy per-section id (delivered 时文 selections, handoff inventory tables) */
export const resourceIdOf = (itemId: string, sectionId: string) => `${itemId}-${sectionId}`;
/** a Resource is a whole Item (#130) */
export const itemResourceIdOf = (itemId: string) => itemId;
const KIND_ZH: Record<string, string> = {
  choice: '阅读选择',
  inlineChoice: '完形填空',
  gapMatch: '选词填空',
  textEntry: '填空',
  match: '连线',
  extendedText: '回答问题',
  order: '连词成句',
  speaking: '口语',
};

/** independent 大题 display name; never replaces the article title */
export function resourceTitle(item: ItemT, sectionIndex: number): string {
  const s = item.sections[sectionIndex];
  const listening = 'paper' in item && (item as { paper?: string }).paper === 'listening';
  const kindZh = (q: (typeof s.questions)[number]) =>
    q.interaction.kind === 'choice' && q.interaction.variant === 'trueFalse' ? '判断正误' : q.interaction.kind === 'choice' && listening ? '听力选择' : KIND_ZH[q.interaction.kind];
  const kinds = [...new Set(s.questions.map(kindZh))].join('／');
  const label = s.label ? `${s.label}. ` : item.sections.length > 1 ? `${sectionIndex + 1}. ` : '';
  // 词汇天天练 (#110): the printed heading names the task better than the interaction kinds
  if ('format' in item && (item as { format?: string }).format === 'vocab-day') return `${item.title} · ${label}${s.instruction}`;
  return `${item.title} · ${label}${kinds}`;
}

/** the Resource title of a whole item: the item's own title (its Parts are inside) */
export const itemResourceTitle = (item: ItemT) => item.title;

export function buildSelection(paperId: string, title: string, playlistId: string, itemIds?: string[], opts: { perSection?: boolean } = {}) {
  const p = JSON.parse(readFileSync(`content/playlists/${playlistId}/playlist.json`, 'utf8')) as PlaylistT;
  const ids = itemIds?.length ? itemIds : p.itemIds;
  const items = ids.map((id) => JSON.parse(readFileSync(`content/playlists/${playlistId}/items/${id}.json`, 'utf8')) as ItemT);
  const sel = {
    format: 'rc-selection-2',
    sourceId: SOURCE_ID,
    paperId,
    title,
    materials: items.map((it) => ({ materialId: materialIdOf(it.id), playlistId, itemId: it.id })),
    resources: opts.perSection
      ? items.flatMap((it) =>
          it.sections.map((s, i) => ({
            resourceId: resourceIdOf(it.id, s.id),
            title: resourceTitle(it, i),
            playlistId,
            itemId: it.id,
            sectionIds: [s.id],
            materialId: materialIdOf(it.id),
          })),
        )
      : items.map((it) => ({
          resourceId: itemResourceIdOf(it.id),
          title: itemResourceTitle(it),
          playlistId,
          itemId: it.id,
          sectionIds: it.sections.map((s) => s.id),
          materialId: materialIdOf(it.id),
        })),
  };
  // format rules from §3.1
  const problems: string[] = [];
  const checkId = (v: string, what: string) => (!ID_RE.test(v) || v.length > 128) && problems.push(`${what} "${v}" is not a valid id`);
  checkId(sel.sourceId, 'sourceId');
  checkId(sel.paperId, 'paperId');
  sel.materials.forEach((m) => checkId(m.materialId, 'materialId'));
  const seen = new Set<string>();
  sel.resources.forEach((r) => {
    checkId(r.resourceId, 'resourceId');
    if (!r.title || r.title.length > 512 || /[\u0000-\u001f\u007f]/.test(r.title)) problems.push(`bad title for ${r.resourceId}`);
    r.sectionIds.forEach((sid) => {
      const k = `${r.itemId}#${sid}`;
      if (seen.has(k)) problems.push(`section ${k} selected twice`);
      seen.add(k);
    });
  });
  sel.materials.forEach((m) => !sel.resources.some((r) => r.materialId === m.materialId) && problems.push(`material ${m.materialId} unused`));
  if (new Set(sel.resources.map((r) => r.resourceId)).size !== sel.resources.length) problems.push('a resourceId is used twice');
  if (problems.length) throw new Error(problems.join('\n'));
  return sel;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const perSection = args.includes('--per-section');
  const [paperId, title, playlistId, ...itemIds] = args.filter((a) => a !== '--per-section');
  if (!paperId || !title || !playlistId) {
    console.error('usage: npx tsx scripts/selection-json.ts [--per-section] <paperId> "<title>" <playlistId> [itemId …]');
    process.exit(1);
  }
  const sel = buildSelection(paperId, title, playlistId, itemIds, { perSection });
  const out = `docs/handoff/production-selection.${paperId}.json`;
  writeFileSync(out, JSON.stringify(sel, null, 2) + '\n');
  console.log(`${out}: ${sel.materials.length} materials, ${sel.resources.length} resources`);
}
