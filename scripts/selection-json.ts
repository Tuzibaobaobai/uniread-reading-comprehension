/**
 * Optional machine selection list (docs/14 §3.1, format rc-selection-2) — one file per logical paper.
 *
 *   npx tsx scripts/selection-json.ts <paperId> "<paper title>" <playlistId> [itemId …]
 *   → docs/handoff/production-selection.<paperId>.json
 *
 * Logical ids (stable; lowercase letters/digits/hyphens, ≤128; not platform DB ids):
 *   sourceId   uniread-rc
 *   materialId <itemId>-article         one per item; every section of the item reuses it
 *   resourceId <itemId>-<sectionId>     one per section (大题); a bank never crosses resources
 * Resource order = item order (week/day) then section order.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { ItemT, PlaylistT } from '../schema/index.ts';

export const SOURCE_ID = 'uniread-rc';
export const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const materialIdOf = (itemId: string) => `${itemId}-article`;
export const resourceIdOf = (itemId: string, sectionId: string) => `${itemId}-${sectionId}`;
const KIND_ZH: Record<string, string> = {
  choice: '阅读选择',
  inlineChoice: '完形填空',
  gapMatch: '选词填空',
  textEntry: '填空',
  match: '连线',
  extendedText: '回答问题',
  order: '连词成句',
};

/** independent 大题 display name; never replaces the article title */
export function resourceTitle(item: ItemT, sectionIndex: number): string {
  const s = item.sections[sectionIndex];
  const kinds = [...new Set(s.questions.map((q) => (q.interaction.kind === 'choice' && q.interaction.variant === 'trueFalse' ? '判断正误' : KIND_ZH[q.interaction.kind])))].join('／');
  const label = s.label ? `${s.label}. ` : item.sections.length > 1 ? `${sectionIndex + 1}. ` : '';
  return `${item.title} · ${label}${kinds}`;
}

export function buildSelection(paperId: string, title: string, playlistId: string, itemIds?: string[]) {
  const p = JSON.parse(readFileSync(`content/playlists/${playlistId}/playlist.json`, 'utf8')) as PlaylistT;
  const ids = itemIds?.length ? itemIds : p.itemIds;
  const items = ids.map((id) => JSON.parse(readFileSync(`content/playlists/${playlistId}/items/${id}.json`, 'utf8')) as ItemT);
  const sel = {
    format: 'rc-selection-2',
    sourceId: SOURCE_ID,
    paperId,
    title,
    materials: items.map((it) => ({ materialId: materialIdOf(it.id), playlistId, itemId: it.id })),
    resources: items.flatMap((it) =>
      it.sections.map((s, i) => ({
        resourceId: resourceIdOf(it.id, s.id),
        title: resourceTitle(it, i),
        playlistId,
        itemId: it.id,
        sectionIds: [s.id],
        materialId: materialIdOf(it.id),
      })),
    ),
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
  if (problems.length) throw new Error(problems.join('\n'));
  return sel;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [paperId, title, playlistId, ...itemIds] = process.argv.slice(2);
  if (!paperId || !title || !playlistId) {
    console.error('usage: npx tsx scripts/selection-json.ts <paperId> "<title>" <playlistId> [itemId …]');
    process.exit(1);
  }
  const sel = buildSelection(paperId, title, playlistId, itemIds);
  const out = `docs/handoff/production-selection.${paperId}.json`;
  writeFileSync(out, JSON.stringify(sel, null, 2) + '\n');
  console.log(`${out}: ${sel.materials.length} materials, ${sel.resources.length} resources`);
}
