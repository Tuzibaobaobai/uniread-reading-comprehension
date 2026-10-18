// Build the handoff release package (HANDOFF.md §5) into .work/release/<tag>/.
//   node scripts/make-handoff-release.mjs v0.1-handoff
// public/  → attach to the GitHub release:
//   rc-content-public.zip   catalog + playlists (items, playlist.json) + assets — NO keys
//   MANIFEST.sha256         sha256 of every file in the zip
//   production-handoff.md   content handoff (docs/handoff/…)
//   RELEASE_NOTES.md        release body
// private/ → deliver through a controlled channel, never attach:
//   rc-keys-private.zip     content/playlists/*/keys/*.json + KEYS.sha256
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile, glob } from 'node:fs/promises';
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

// public content (keys excluded)
const isKey = (f) => /\/keys\//.test(f);
const publicFiles = [
  'content/catalog.json',
  ...(await list('content/playlists/*/playlist.json')),
  ...(await list('content/playlists/*/items/*.json')),
  ...(await list('content/assets/**/*.*')),
].filter((f) => !isKey(f) && existsSync(f));
if (publicFiles.some(isKey)) throw new Error('keys in public package');

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

const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();
const items = (await list('content/playlists/*/items/*.json')).length;
await writeFile(
  `${pub}/RELEASE_NOTES.md`,
  `# ${tag} · RC 阅读理解模块交接

入口文档：[HANDOFF.md](../blob/${tag}/HANDOFF.md) · 演示站：https://uniread-reading-comprehension.vercel.app

## 内容
- 4 个合集、${items} 篇（试点选材）：3 年级 8、小升初 6、7 年级 5、5 年级 1
- 题型：单选、完形、共享词库、文本填空（含句型转换）、连线、连词成句、开放问答（LLM 评分）
- 内容为 AI Agent 转录并独立复核，未人工复核；所有答案键为 \`pending\`，待人工确认

## 附件
| 文件 | 说明 |
| --- | --- |
| \`rc-content-public.zip\` | catalog、playlist、item、图片（${publicFiles.length} 个文件，**不含答案键**） |
| \`MANIFEST.sha256\` | 上述文件的 sha256 |
| \`production-handoff.md\` | 内容交接清单（UniRead 规约 v0.3 模板） |

答案键 \`rc-keys-private.zip\`（${keyFiles.length} 个文件）通过受控渠道单独提供，不随 release 发布。

## 待决定
账号与作答保存、难度映射、版权许可、答案人工复核、LLM 评分校准、4 种题型的平台适配、部分 Figma 组件（详见 HANDOFF.md §6）。

源码提交：\`${commit}\`
`,
);

console.log(`release package → ${out}`);
console.log(`  public : rc-content-public.zip (${publicFiles.length} files), MANIFEST.sha256, production-handoff.md, RELEASE_NOTES.md`);
console.log(`  private: rc-keys-private.zip (${keyFiles.length} keys) — controlled delivery only`);
