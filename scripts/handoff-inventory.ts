/**
 * Generate the factual tables of a UniRead production handoff (docs/14-agent-production-rules.md)
 * straight from content/, so the handoff never drifts from the data.
 *
 *   npx tsx scripts/handoff-inventory.ts [playlistId …] > /tmp/inventory.md
 *
 * Logical ids (stable across restyling; not platform DB ids):
 *   resourceId = <itemId>.<sectionId>   one 大题 (section) — a shared bank never crosses a resource
 *   materialId = <itemId>.article       the article; every section of the item reuses it
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import type { InlineT, ItemKeyT, ItemT, PlaylistT, QuestionT } from '../schema/index.ts';

const root = new URL('../content/', import.meta.url);
const read = <T>(p: string): T => JSON.parse(readFileSync(new URL(p, root), 'utf8')) as T;
const sha = (p: string) => createHash('sha256').update(readFileSync(new URL(p, root))).digest('hex').slice(0, 12);
const text = (n: InlineT[] = []) => n.map((x) => ('v' in x ? x.v : '')).join('').trim();
const cell = (s: string | number | undefined) => String(s ?? '').replace(/\|/g, '／').replace(/\n/g, ' ');

const KIND_ZH: Record<QuestionT['interaction']['kind'], string> = {
  choice: '单选',
  inlineChoice: '完形（每空单选）',
  gapMatch: '共享词／句库',
  textEntry: '文本填空',
  match: '连线',
  extendedText: '开放问答',
  order: '连词成句',
};
const PLATFORM: Record<string, string> = {
  choice: '可适配（single-selection）',
  inlineChoice: '可适配（single-selection，按空；需逐题核对）',
  gapMatch: '可适配（slot-selection）',
  textEntry: '待平台适配',
  match: '待平台适配（含一对多）',
  order: '待平台适配',
  extendedText: '待平台适配（含 LLM 评分）',
};

const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(new URL('playlists/', root)).filter((d) => existsSync(new URL(`playlists/${d}/playlist.json`, root)));

const out: string[] = [];
for (const pl of ids) {
  const p = read<PlaylistT>(`playlists/${pl}/playlist.json`);
  const items = p.itemIds.map((id) => read<ItemT>(`playlists/${pl}/items/${id}.json`));
  out.push(`### ${p.id} · ${p.title}`, '');
  out.push(`- 合集封面：\`${p.cover}\`（书籍封面扫描，sha256:${sha(p.cover)}）；gradeBand：${p.gradeBand}（学校年级，不等于 UniRead L 等级）；本次交付 ${items.length} 篇`, '');

  out.push('#### 大题与共享材料映射', '');
  out.push('| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |');
  out.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  let n = 0;
  for (const it of items) {
    for (const s of it.sections) {
      n++;
      const qs = s.questions;
      const kinds = [...new Set(qs.map((q) => KIND_ZH[q.interaction.kind]))].join('、');
      const pts = qs.reduce((a, q) => a + (q.points ?? 1), 0);
      const label = s.label ? `${s.label}. ` : '';
      const bank = s.bank?.length ? `本大题内 ${s.bank.length} 项供 ${qs.length} 空，每项限用一次，改选即从原空释放` : '—';
      out.push(
        `| ${n} | \`${it.id}.${s.id}\` | ${cell(`${it.title} · ${label}${s.instruction}`)} | \`${it.id}\` | \`${s.id}\` | \`${it.id}.article\`（${it.sections.length} 个大题共用） | ${qs[0].id}–${qs[qs.length - 1].id}／${qs.length} | ${pts} | ${kinds} | ${bank} |`,
      );
    }
  }
  out.push('');

  out.push('#### 元数据来源与资产', '');
  out.push('| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |');
  out.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const it of items) {
    const m = it.meta;
    const estimated = (it.errata ?? []).some((e) => /建议用时/.test(e.original + e.corrected));
    const imgs = it.article.images.map((i) => `\`${i.src}\``).join('<br>') || '无';
    const thumb = it.thumbnail ? `独立文件 \`${it.thumbnail}\`（裁自原书图片）` : '平台占位（RC 以标题生成文字卡）';
    out.push(
      `| \`${it.id}\` | ${it.source.pdfPages.join(',')}／${it.source.bookPages.join(',')} | ${m.difficulty}（原书） | ${m.wordCount}（原书信息框） | ${m.suggestedMinutes} 分钟（${estimated ? '估算：原书缺，按词数÷约20词/分' : '原书'}） | ${m.hasVideo ? '原书标记有讲解视频；本次未交付视频' : '否'} | ${imgs} | ${thumb} |`,
    );
  }
  out.push('');

  out.push('#### 私有答案（只列位置与摘要，不含答案）', '');
  out.push('| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |');
  out.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const it of items) {
    const kp = `playlists/${pl}/keys/${it.id}.json`;
    const k = read<ItemKeyT>(kp);
    const ref = k.officialRef ? `${k.officialRef.pdf} p.${k.officialRef.pages.join(',')}` : '—（生成）';
    out.push(`| \`${it.id}\` | \`content/${kp}\` | ${sha(kp)} | ${k.answerSource} | ${cell(ref)} | ${k.reviewStatus} | ${it.status.content} v${it.status.version} |`);
  }
  out.push('');

  out.push('#### 题型与平台适配', '');
  const kinds = new Map<string, number>();
  items.forEach((it) => it.sections.forEach((s) => s.questions.forEach((q) => kinds.set(q.interaction.kind, (kinds.get(q.interaction.kind) ?? 0) + 1))));
  out.push('| 题型 | 小题数 | 平台状态 |', '| --- | --- | --- |');
  kinds.forEach((c, k) => out.push(`| ${KIND_ZH[k as keyof typeof KIND_ZH]}（${k}） | ${c} | ${PLATFORM[k]} |`));
  out.push('');
}
console.log(out.join('\n'));
void text;
