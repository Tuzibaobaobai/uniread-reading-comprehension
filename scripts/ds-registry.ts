/**
 * Render design-system/components.registry.json (docs/14 §15) as docs/design/component-registry.md — the readable
 * table for the UniRead designer and the review issue. Generated; edit the JSON, not the markdown.
 *
 *   npx tsx scripts/ds-registry.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';

type Entry = {
  code: string;
  status: string;
  product: string;
  description: string;
  screens: string[];
  figma?: { nodeId: string; name: string; group: string; url: string };
  figmaProposal?: { nodeId: string; url: string };
  variants?: Record<string, string>;
  note?: string;
};

const LABEL: Record<string, string> = {
  reuse: '复用',
  extend: '扩展变体（待批准）',
  proposed: '新组件（待批准）',
  approved: '已批准',
  deprecated: '已废弃',
};

export function render(reg: { designSystem: string; components: Entry[] }) {
  const out = [
    '# 组件登记表（生成文件）',
    '',
    `由 \`scripts/ds-registry.ts\` 从 \`design-system/components.registry.json\` 生成，不要手改。设计系统版本 ${reg.designSystem}；流程见 docs/14 §15。`,
    '',
    '「画面」列是 Figma 页面 2B-Content-Pages 上的状态编号（与 `.work/figma/capture.mjs` 一致）。',
    '',
  ];
  const counts = reg.components.reduce<Record<string, number>>((a, c) => ((a[c.status] = (a[c.status] ?? 0) + 1), a), {});
  out.push(`共 ${reg.components.length} 项：${Object.entries(counts).map(([s, n]) => `${LABEL[s] ?? s} ${n}`).join('，')}。`, '');
  for (const status of ['reuse', 'extend', 'proposed', 'approved', 'deprecated']) {
    const list = reg.components.filter((c) => c.status === status);
    if (!list.length) continue;
    out.push(`## ${LABEL[status]}（${list.length}）`, '', '| 代码组件 | 用途 | UniRead 组件 | 变体 | 画面 | 说明 |', '| --- | --- | --- | --- | --- | --- |');
    for (const c of list) {
      const fig = c.figma ? `[${c.figma.group} / ${c.figma.name}](${c.figma.url})` : status === 'proposed' ? `\`RC/${c.code.replace(/^rc\//, '')}\`（新建）` : '—';
      const v = c.variants ? Object.entries(c.variants).map(([k, val]) => `**${k}**: ${val}`).join('<br>') : '';
      const prop = c.figmaProposal ? ` · [提案 ↗](${c.figmaProposal.url})` : '';
      out.push(`| \`${c.code}\` | ${c.description} | ${fig}${prop} | ${v} | ${c.screens.join(' ')} | ${c.note ?? ''} |`);
    }
    out.push('');
  }
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const reg = JSON.parse(readFileSync('design-system/components.registry.json', 'utf8'));
  writeFileSync('docs/design/component-registry.md', render(reg) + '\n');
  console.log(`docs/design/component-registry.md: ${reg.components.length} components`);
}
