// Build the handoff release package (HANDOFF.md §5) into .work/release/<tag>/.
//   node scripts/make-handoff-release.mjs v0.1-handoff
// public/  → attach to the GitHub release:
//   rc-content-public.zip   catalog + playlists (items, playlist.json) + image assets — NO keys, NO audio/video
//   MANIFEST.sha256         sha256 of every file in the zip
//   rc-media-<playlist>.zip audio/video of one playlist (gitignored; made by scripts/audio.mjs) + MEDIA.json
//                           manifest {path, bytes, sha256, seconds, usedBy} — UniRead hosts these on its own CDN;
//                           items keep referencing them by the same relative path (assets/<pl>/…)
//   production-handoff.md   content handoff (docs/handoff/…)
//   RELEASE_NOTES.md        release body
//   production-selection.*.json   rc-selection-2 machine selection lists (docs/handoff/)
//   rc-reference-screens-<viewport>.zip   layout baseline before answering, one zip per viewport (.work/reference/public)
// private/ → deliver through a controlled channel, never attach:
//   rc-keys-private.zip                content/playlists/*/keys/*.json + KEYS.sha256
//   rc-reference-review-private.zip    review screenshots (show answers; .work/reference/private)
// Run `REFERENCE=1 npx playwright test e2e/reference.spec.ts` first to refresh the screenshots.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readdir, readFile, rm, writeFile, glob } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const tag = process.argv[2] ?? 'v0.1-handoff';
const out = `.work/release/${tag}`;
const pub = `${out}/public`;
const priv = `${out}/private`;
await rm(out, { recursive: true, force: true });
await mkdir(pub, { recursive: true });
await mkdir(priv, { recursive: true });

const sha = async (f) => createHash('sha256').update(await readFile(f)).digest('hex');
const list = async (pattern, exclude = () => false) => {
  const files = [];
  for await (const f of glob(pattern)) if (!exclude(f)) files.push(f);
  return files.sort();
};

// public content (keys excluded; audio/video go in rc-media-<playlist>.zip)
const isKey = (f) => /\/keys\//.test(f);
const isMedia = (f) => /\.(m4a|mp3|mp4)$/i.test(f);
const publicFiles = [
  'content/catalog.json',
  ...(await list('content/playlists/*/playlist.json')),
  ...(await list('content/playlists/*/items/*.json')),
  ...(await list('content/assets/**/*.*')),
].filter((f) => !isKey(f) && !isMedia(f) && existsSync(f));
if (publicFiles.some(isKey)) throw new Error('keys in public package');

// media per playlist: every audio file an item references must exist (they are not in git — run scripts/audio.mjs)
const media = new Map(); // playlist → [{path, seconds, usedBy}]
for (const f of await list('content/playlists/*/items/*.json')) {
  const item = JSON.parse(await readFile(f, 'utf8'));
  // listening recordings (scripts/audio.mjs) and speaking examiner lines (scripts/tts.mjs)
  const refs = (item.sections ?? []).flatMap((s) => [
    ...(s.audio ? [{ audio: s.audio, at: `${item.id}/${s.id}` }] : []),
    ...s.questions.flatMap((q) => (q.interaction.turns ?? []).filter((t) => t.audio).map((t) => ({ audio: t.audio, at: `${item.id}/${q.id}/${t.id}` }))),
  ]);
  for (const { audio, at } of refs) {
    const path = `content/${audio.src}`;
    if (!existsSync(path)) throw new Error(`${at}: audio missing ${path} — run scripts/audio.mjs / scripts/tts.mjs`);
    const entries = media.get(item.playlistId) ?? [];
    const e = entries.find((x) => x.path === path) ?? (entries.push({ path, seconds: audio.seconds, usedBy: [] }), entries.at(-1));
    e.usedBy.push(at);
    media.set(item.playlistId, entries);
  }
}
const mediaZips = [];
for (const [pl, entries] of [...media].sort()) {
  const manifestJson = [];
  for (const e of entries.sort((a, b) => a.path.localeCompare(b.path))) {
    const bytes = (await readFile(e.path)).length;
    manifestJson.push({ path: e.path.replace(/^content\//, ''), bytes, sha256: await sha(e.path), seconds: e.seconds, usedBy: e.usedBy });
  }
  const mDir = `${out}/media-${pl}`;
  await mkdir(mDir, { recursive: true });
  await writeFile(`${mDir}/MEDIA.json`, JSON.stringify({ playlist: pl, format: 'listening: audio/mp4 (AAC, 48 kbps mono); speaking examiner lines: audio/mpeg (64 kbps, Volcano Engine TTS)', files: manifestJson }, null, 2) + '\n');
  const zip = `rc-media-${pl}.zip`;
  execFileSync('zip', ['-q', '-X', '-j', `${pub}/${zip}`, `${mDir}/MEDIA.json`]);
  execFileSync('zip', ['-q', '-X', `${process.cwd()}/${pub}/${zip}`, ...manifestJson.map((m) => m.path)], { cwd: 'content' });
  mediaZips.push({ zip, files: manifestJson.length, mb: manifestJson.reduce((n, m) => n + m.bytes, 0) / 1e6 });
}

const manifest = [];
for (const f of publicFiles) manifest.push(`${await sha(f)}  ${f}`);
await writeFile(`${pub}/MANIFEST.sha256`, manifest.join('\n') + '\n');
execFileSync('zip', ['-q', '-X', `${pub}/rc-content-public.zip`, ...publicFiles]);

// private keys (separate)
const keyFiles = await list('content/playlists/*/keys/*.json');
const keyManifest = [];
for (const f of keyFiles) keyManifest.push(`${await sha(f)}  ${f}`);
await writeFile(`${priv}/KEYS.sha256`, keyManifest.join('\n') + '\n');
execFileSync('zip', ['-q', '-X', `${priv}/rc-keys-private.zip`, ...keyFiles, `${priv}/KEYS.sha256`]);

await copyFile('docs/handoff/production-handoff.rc-pilot-2026-10.md', `${pub}/production-handoff.md`);
const selections = await list('docs/handoff/production-selection.*.json');
for (const f of selections) await copyFile(f, `${pub}/${f.split('/').pop()}`);

// layout restoration baseline (iron rule): public = before answering, private = review (answers visible)
if (!existsSync('.work/reference/public')) throw new Error('run REFERENCE=1 npx playwright test e2e/reference.spec.ts first');
// one zip per viewport (a single zip of every screenshot is too large to upload reliably)
const viewports = (await readdir('.work/reference/public')).filter((d) => !d.startsWith('.')).sort();
const viewportShots = {};
for (const v of viewports) {
  execFileSync('zip', ['-q', '-r', '-X', `${process.cwd()}/${pub}/rc-reference-screens-${v}.zip`, v], { cwd: '.work/reference/public' });
  viewportShots[v] = (await list(`.work/reference/public/${v}/*.png`)).length;
}
execFileSync('zip', ['-q', '-r', '-X', `${process.cwd()}/${priv}/rc-reference-review-private.zip`, '.'], { cwd: '.work/reference/private' });
const shots = (await list('.work/reference/public/**/*.png')).length;
const reviewShots = (await list('.work/reference/private/**/*.png')).length;

const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();
const items = (await list('content/playlists/*/items/*.json')).length;
await writeFile(
  `${pub}/RELEASE_NOTES.md`,
  `# ${tag} · RC 阅读理解模块交接

入口文档：[HANDOFF.md](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/blob/${tag}/HANDOFF.md)（按 UniRead 生产规约 v0.6） · 演示站：https://uniread-reading-comprehension.vercel.app

> 铁律：接入时必须还原 RC 的布局和交互，只替换数据、存储和通信适配。

## 内容
- 7 个合集、${items} 篇，均为全书：3、4、5 年级，小升初、7 年级、8 年级、中考（第 3 辑）
- 题型：单选、完形、共享词库、文本填空（含句型转换）、连线、连词成句、开放问答（LLM 评分）
- 试点篇目由 AI Agent 转录并独立复核，全书批量篇目只经脚本核对，都未人工复核；所有答案键为 \`pending\`，待人工确认

## 附件
| 文件 | 说明 |
| --- | --- |
| \`rc-content-public.zip\` | catalog、playlist、item、图片（${publicFiles.length} 个文件，**不含答案键**） |
| \`MANIFEST.sha256\` | 上述文件的 sha256 |
${mediaZips.map((m) => `| \`${m.zip}\` | 音频 ${m.files} 个（${m.mb.toFixed(1)} MB，AAC 48 kbps 单声道）+ \`MEDIA.json\`（路径、大小、sha256、时长、引用位置）；请上传到 UniRead 自己的存储／CDN，item 中按相同相对路径 \`assets/…\` 引用 |`).join('\n')}
| \`production-handoff.md\` | 内容交接清单（UniRead 规约 v0.6 模板，含稳定题目 ID、布局还原两节） |
| \`production-selection.*.json\` | 机器选材清单（rc-selection-2），${selections.length} 份 |
${viewports.map((v) => `| \`rc-reference-screens-${v}.zip\` | 布局还原基线：来源页面作答前截图 · ${v}（${viewportShots[v]} 张） |`).join('\n')}

私有材料不随 release 发布：答案键（${keyFiles.length} 个文件）在本 tag 的 \`content/playlists/<合集>/keys/\`；复盘截图（${reviewShots} 张，含答案）在本 tag 下运行 \`REFERENCE=1 npx playwright test e2e/reference.spec.ts\` 重新生成。流程见 HANDOFF.md §5。

## 相对 v0.3-handoff
- 新增 330 篇：4 年级（60）、8 年级（90）、小升初第 3 辑（90）、中考第 3 辑（90），答案全部来自官方答案册
- 移除旧版小升初 \`ci-xsc\`（6 篇试点）：来源 PDF 撤下，相关 item 与小题 ID 退役、不再复用；\`ci-xsc-pilot-1\` 选材一并退役
- 3／5／7 年级 210 篇的小题 ID 全部沿用
- 新增选材清单：\`ci-g4-full\`、\`ci-g8-full\`、\`ci-xsc3-full\`、\`ci-zk-full\`
- 阅读页支持图片选项（\`Option.image\`）；合集按年级排序
- 题号很多时，底栏题号条两侧显示“更多”按钮（箭头 + 被遮住的题数），可翻页、滑动或用鼠标滚轮查看，当前题自动居中
- 原书与官方答案疑似错误新提 issue #22–#61（标签 \`errata\`），内容按原书照录

## 相对 v0.2-handoff
- 新增 196 篇：7 年级 W2–W18（85 篇）、3 年级（52 篇）、5 年级（59 篇）；3／5／7 年级均为全书，答案全部来自官方答案册
- 已有 20 篇的小题 ID 全部沿用，新增篇目为首次生产，没有复用退役 ID
- 新增全书机器选材清单：\`ci-g7-full\`、\`ci-g3-full\`、\`ci-g5-full\`
- 原书和官方答案的疑似错误按原书照录，已提 GitHub issue #14–#21（标签 \`errata\`），待人工确认后再改
- 原书缺失的建议用时按该年级平均阅读速度加做题时间估算，方法记在 item 的 errata 中
- 批量篇目（状态 \`transcribed\`）只经脚本核对（官方答案字母、OCR 文本覆盖、词数），未经独立 Agent 或人工复核

## 待决定
账号与作答保存、难度映射、版权许可、答案人工复核、LLM 评分校准、4 种题型的平台适配、部分 Figma 组件（详见 HANDOFF.md §6）。

源码提交：\`${commit}\`
`,
);

console.log(`release package → ${out}`);
console.log(`  public : rc-content-public.zip (${publicFiles.length} files), MANIFEST.sha256, production-handoff.md, RELEASE_NOTES.md`);
console.log(`  public : ${mediaZips.map((m) => `${m.zip} (${m.files} files, ${m.mb.toFixed(1)} MB)`).join(', ') || 'no media'}`);
console.log(`  public : ${selections.length} selection files, ${viewports.length} rc-reference-screens-<viewport>.zip (${shots} screenshots)`);
console.log(`  private: rc-keys-private.zip (${keyFiles.length} keys), rc-reference-review-private.zip (${reviewShots}) — controlled delivery only`);
