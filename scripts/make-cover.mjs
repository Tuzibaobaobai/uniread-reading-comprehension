// Render a playlist cover for exam series (KET / PET 真题) from one fixed template (GitHub #76) — set the
// playlist's "cover" to cover.jpg and "banner" to banner.jpg:
// the same authoritative layout for every book of a series type — big exam name, 官方真题, and a subtitle
// band that names the book in the series. Uses the project's own fonts (Source Sans 3, Noto Sans SC).
//   node scripts/make-cover.mjs ket1        → content/assets/ket1/cover.jpg (1024 × 1024, cards)
//                                             + banner.jpg (1221 × 717 = Figma Playlist panel 407:239)
//   node scripts/make-cover.mjs --all
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

/** exam types: one look per type */
const TYPES = {
  KET: { level: 'A2 Key for Schools', zh: '剑桥 KET 青少版', accent: '#1E6E82', accentLight: '#8FD6E3' },
  PET: { level: 'B1 Preliminary for Schools', zh: '剑桥 PET 青少版', accent: '#8C2F39', accentLight: '#F2B8BE' },
  // 词汇天天练 (#110): same layout, a word instead of the exam name
  ZKV: { level: 'Shanghai Zhongkao 2026', zh: '上海中考', accent: '#2F6B4F', accentLight: '#A8DDBF', big: 'Vocab', title: '考纲词汇', css: '.exam { font-size: 300px; letter-spacing: -8px; top: 190px; }' },
};
/** one entry per playlist: the series subtitle and what the book contains */
const COVERS = {
  ket1: { type: 'KET', series: '校园版真题 1', detail: '4 套 · 阅读与写作 · 听力 · 口语' },
  ket2: { type: 'KET', series: '校园版真题 2', detail: '4 套 · 阅读与写作 · 听力 · 口语' },
  ket3: { type: 'KET', series: '校园版真题 3', detail: '4 套 · 阅读与写作 · 听力 · 口语' },
  pet1: { type: 'PET', series: '校园版真题 1', detail: '4 套 · 阅读 · 写作 · 听力 · 口语' },
  pet2: { type: 'PET', series: '校园版真题 2', detail: '4 套 · 阅读 · 写作 · 听力 · 口语' },
  pet3: { type: 'PET', series: '校园版真题 3', detail: '4 套 · 阅读 · 写作 · 听力 · 口语' },
  zkv: { type: 'ZKV', series: '考纲词汇天天练', detail: '用法手册词条 · 70 天练习' },
};

const font = (pkg, file) => pathToFileURL(resolve('node_modules/@fontsource', pkg, file)).href;
const BANNER_CSS = `
  body { width: 1221px; height: 717px; }
  .cover { width: 1221px; height: 717px; }
  .rule { left: 64px; }
  .top { left: 100px; right: 64px; top: 56px; font-size: 30px; }
  .exam { left: 86px; top: 120px; font-size: 300px; letter-spacing: -10px; }
  .title { left: auto; right: 64px; top: 360px; font-size: 112px; letter-spacing: 8px; text-align: right; }
  .band { height: 176px; padding: 30px 64px 0 100px; display: flex; align-items: baseline; gap: 32px; }
  .series { font-size: 76px; }
  .detail { margin: 0; font-size: 32px; }`;

/** square cover for playlist cards; wide banner (same design) for the playlist page panel */
const html = ({ type, series, detail }, variant = 'cover') => {
  const t = TYPES[type];
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${font('source-sans-3', '900.css')}">
<link rel="stylesheet" href="${font('source-sans-3', '600.css')}">
<link rel="stylesheet" href="${font('noto-sans-sc', '900.css')}">
<link rel="stylesheet" href="${font('noto-sans-sc', '700.css')}">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1024px; height: 1024px; }
  .cover {
    position: relative; width: 1024px; height: 1024px; overflow: hidden; color: #fff;
    background:
      repeating-linear-gradient(180deg, transparent 0 63px, rgba(255,255,255,.05) 63px 64px),
      linear-gradient(160deg, #10294a 0%, #0a1b33 100%);
    font-family: 'Source Sans 3', 'Noto Sans SC', sans-serif;
  }
  .rule { position: absolute; left: 72px; top: 0; bottom: 0; width: 6px; background: ${t.accent}; }
  .top { position: absolute; left: 112px; right: 72px; top: 72px; display: flex; justify-content: space-between; align-items: baseline;
         font-weight: 600; font-size: 34px; letter-spacing: 2px; color: ${t.accentLight}; text-transform: uppercase; }
  .top .zh { font-family: 'Noto Sans SC'; font-weight: 700; letter-spacing: 4px; text-transform: none; color: rgba(255,255,255,.75); }
  .exam { position: absolute; left: 96px; top: 150px; font-weight: 900; font-size: 420px; line-height: .9; letter-spacing: -14px; }
  .title { position: absolute; left: 112px; top: 560px; font-family: 'Noto Sans SC'; font-weight: 900; font-size: 150px; line-height: 1; letter-spacing: 12px; color: ${t.accentLight}; }
  .band { position: absolute; left: 0; right: 0; bottom: 0; height: 200px; background: ${t.accent}; padding: 34px 72px 0 112px; }
  .series { font-family: 'Noto Sans SC'; font-weight: 900; font-size: 84px; line-height: 1.1; }
  .detail { margin-top: 10px; font-family: 'Noto Sans SC'; font-weight: 700; font-size: 34px; color: rgba(255,255,255,.85); }
${t.css ?? ''}
${variant === 'banner' ? BANNER_CSS : ''}
</style></head><body><div class="cover">
  <div class="rule"></div>
  <div class="top"><span>${t.level}</span><span class="zh">${t.zh}</span></div>
  <div class="exam">${t.big ?? type}</div>
  <div class="title">${t.title ?? '官方真题'}</div>
  <div class="band"><div class="series">${series}</div><div class="detail">${detail}</div></div>
</div></body></html>`;
};

const ids = process.argv.includes('--all') ? Object.keys(COVERS) : process.argv.slice(2);
if (!ids.length || ids.some((id) => !COVERS[id])) {
  console.error(`usage: node scripts/make-cover.mjs <${Object.keys(COVERS).join('|')}> | --all`);
  process.exit(1);
}
const browser = await chromium.launch({ channel: 'chrome' }); // system Chrome, as in playwright.config.ts
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
for (const id of ids) {
  for (const [variant, size] of [['cover', { width: 1024, height: 1024 }], ['banner', { width: 1221, height: 717 }]]) {
  await page.setViewportSize(size);
  // a file:// page may load the local font files (setContent's about:blank may not)
  const tmp = resolve('.work', `cover-${id}-${variant}.html`);
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, html(COVERS[id], variant));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const t = TYPES[COVERS[id].type];
  const missing = await page.evaluate(
    (checks) => checks.filter(([f, s]) => !document.fonts.check(f, s)).map(([f]) => f),
    [['900 100px "Source Sans 3"', t.big ?? 'KET'], ['900 100px "Noto Sans SC"', t.title ?? '官方真题']],
  );
  if (missing.length) throw new Error(`fonts not loaded: ${missing.join(', ')}`);
  await page.locator('.cover').screenshot({ path: `content/assets/${id}/${variant}.jpg`, type: 'jpeg', quality: 90 });
  console.log(`${variant} → content/assets/${id}/${variant}.jpg`);
  }
}
await browser.close();
