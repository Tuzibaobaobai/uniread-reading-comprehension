/**
 * Stable question ids (docs/14 §3.2): compare items against a baseline revision and the full Git
 * history, for the handoff table "本次更新与稳定题目ID".
 *
 *   npx tsx scripts/id-changes.ts [--base <tag|commit>] [playlistId …]
 *
 * Per item it reports: new / removed (retired) ids, reordering (same id, new number), and ids whose
 * prompt or options changed (same id — confirm it is still the same question, otherwise it needs a new id).
 * It FAILS when a current id was retired earlier in history (reuse) — that must never happen.
 * Item ids that never existed at the baseline are reported as 首次生产.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import type { ItemT, QuestionT } from '../schema/index.ts';

const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const base = baseIdx >= 0 ? args[baseIdx + 1] : null;
const playlists = args.filter((a, i) => a !== '--base' && i !== baseIdx + 1);

const git = (...a: string[]) => {
  try {
    return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
};
const at = (ref: string, path: string): ItemT | null => {
  const raw = git('show', `${ref}:${path}`);
  return raw ? (JSON.parse(raw) as ItemT) : null;
};
const qsOf = (it: ItemT) => it.sections.flatMap((s) => s.questions);
/** what the learner sees and answers (prompt, options, blanks…) — scoring settings excluded */
const sig = (q: QuestionT) => {
  const { scoring: _s, ...shown } = q.interaction as QuestionT['interaction'] & { scoring?: string };
  void _s;
  return JSON.stringify(shown);
};
const scoringOf = (q: QuestionT) => (q.interaction as { scoring?: string }).scoring ?? '';

const ids = playlists.length ? playlists : readdirSync('content/playlists').filter((d) => existsSync(`content/playlists/${d}/playlist.json`));
const rows: string[] = [];
const problems: string[] = [];

for (const pl of ids) {
  for (const f of readdirSync(`content/playlists/${pl}/items`).filter((x) => x.endsWith('.json')).sort()) {
    const path = `content/playlists/${pl}/items/${f}`;
    const cur = JSON.parse(readFileSync(path, 'utf8')) as ItemT;
    const curQs = qsOf(cur);

    // every id this item has ever had, and the last commit each was seen in
    const history = (git('log', '--format=%H', '--', path) ?? '').trim().split('\n').filter(Boolean).reverse();
    const everSeen = new Set<string>();
    const retired = new Set<string>();
    let prev = new Set<string>();
    for (const c of history) {
      const old = at(c, path);
      if (!old) continue;
      const now = new Set(qsOf(old).map((q) => q.id));
      prev.forEach((id) => !now.has(id) && retired.add(id));
      now.forEach((id) => everSeen.add(id));
      prev = now;
    }
    // ids dropped in the working tree are retired too
    prev.forEach((id) => !curQs.some((q) => q.id === id) && retired.add(id));
    curQs.forEach((q) => retired.has(q.id) && problems.push(`${cur.id}: ${q.id} was retired earlier and must not be reused`));

    const old = base ? at(base, path) : null;
    if (!old) {
      rows.push(`| \`${cur.id}\` | 首次生产${base ? `（${base} 中不存在）` : ''} | 无 | ${curQs[0]?.id}–${curQs[curQs.length - 1]?.id}（${curQs.length} 题） | — | — |`);
      continue;
    }
    const oldQs = qsOf(old);
    const changes: string[] = [];
    for (const q of curQs) {
      const o = oldQs.find((x) => x.id === q.id);
      if (!o) changes.push(`| \`${cur.id}\` | 新增 | 无 | \`${q.id}\` | → ${q.number} | 待填写 |`);
      else {
        if (o.number !== q.number) changes.push(`| \`${cur.id}\` | 调序 | \`${q.id}\` | \`${q.id}\` | ${o.number} → ${q.number} | — |`);
        if (sig(o) !== sig(q)) changes.push(`| \`${cur.id}\` | 题面变更（待确认是否同题） | \`${q.id}\` | \`${q.id}\` | — | 同题勘误写依据；改变题意须换新 id |`);
        if (scoringOf(o) !== scoringOf(q)) changes.push(`| \`${cur.id}\` | 评分方式修正 | \`${q.id}\` | \`${q.id}\` | — | ${scoringOf(o) || '默认'} → ${scoringOf(q) || '默认'} |`);
        if ((o.points ?? 1) !== (q.points ?? 1)) changes.push(`| \`${cur.id}\` | 分值修正 | \`${q.id}\` | \`${q.id}\` | — | ${o.points ?? 1} → ${q.points ?? 1} 分 |`);
      }
    }
    for (const o of oldQs) if (!curQs.some((q) => q.id === o.id)) changes.push(`| \`${cur.id}\` | 删除 | \`${o.id}\` | 退役 | ${o.number} → — | 待填写 |`);
    rows.push(...(changes.length ? changes : [`| \`${cur.id}\` | 全部沿用 | — | — | — | — |`]));
    void everSeen;
  }
}

console.log(`<!-- npx tsx scripts/id-changes.ts${base ? ` --base ${base}` : ''} ${playlists.join(' ')} -->`);
console.log('| resourceId／Item | 操作 | 原小题ID | 更新后小题ID | 展示题号变化 | 原因与证据位置 |');
console.log('| --- | --- | --- | --- | --- | --- |');
console.log(rows.join('\n'));
if (problems.length) {
  console.error(`\n${problems.length} id problem(s):\n${problems.join('\n')}`);
  process.exit(1);
}
