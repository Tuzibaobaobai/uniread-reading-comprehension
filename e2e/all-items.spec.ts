// Every item in the catalog opens: article title, first question and the pager render (desktop only — fast smoke test).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('content/catalog.json', 'utf8')) as {
  playlists: { id: string; format?: string; items: { id: string; title: string; paper?: string }[] }[];
};

test('every item renders', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop only');
  test.setTimeout(900_000); // ~750 items incl. 195 vocab days (three tabs each)
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const p of catalog.playlists) {
    for (const it of p.items) {
      await page.goto(`/#/p/${p.id}/${it.id}`);
      if (p.format === 'vocab') {
        // 词汇天天练 (#133): Scan's first word, the day's entries in Study, then the first page of the quiz
        await expect(page.locator('.scan-word'), it.id).toBeVisible();
        await page.getByRole('tab', { name: /学习/ }).click();
        await expect(page.locator('.entry').first(), it.id).toBeVisible();
        await page.getByRole('tab', { name: /测验/ }).click();
        // a row per question, or the printed table with its answer cells (中考 days 69–70)
        await expect(page.locator('.vq-row, .vq-table input').first(), it.id).toBeVisible();
        await expect(page.locator('.question-dot').first(), it.id).toBeVisible();
        continue;
      }
      if ('paper' in it) {
        // exam papers ask for practice / exam mode first; the pane shows the paper title above the Part
        await page.getByRole('button', { name: /练习模式/ }).click();
        await expect(page.locator('.exam-part-kicker'), it.id).toHaveText(it.title);
      } else await expect(page.locator('.article-title'), it.id).toHaveText(it.title);
      await expect(page.locator('.q-prompt').first(), it.id).toBeVisible();
      await expect(page.locator('.question-dot').first(), it.id).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});
