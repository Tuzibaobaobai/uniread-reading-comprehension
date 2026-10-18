// Every item in the catalog opens: article title, first question and the pager render (desktop only — fast smoke test).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('content/catalog.json', 'utf8')) as { playlists: { id: string; items: { id: string; title: string }[] }[] };

test('every item renders', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop only');
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const p of catalog.playlists) {
    for (const it of p.items) {
      await page.goto(`/#/p/${p.id}/${it.id}`);
      await expect(page.locator('.article-title'), it.id).toHaveText(it.title);
      await expect(page.locator('.q-prompt').first(), it.id).toBeVisible();
      await expect(page.locator('.question-dot').first(), it.id).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});
