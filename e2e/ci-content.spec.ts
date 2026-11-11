import { expect, test, type Page } from '@playwright/test';
import { goQuestion, lastPage } from './nav';

// 时文 content fixes from the delivery QA (2026-11-11)

const showQuestions = async (page: Page) => {
  if ((page.viewportSize()?.width ?? 1440) < 1024) await page.getByRole('tab', { name: /题目/ }).click();
};

test('word-form prompts show the bracketed base word once (hint only, docs/04 §2.2)', async ({ page }) => {
  await page.goto('/#/p/ci-g8/ci-g8-w06-fri');
  await showQuestions(page);
  await goQuestion(page, /第 5 题/);
  const prompt = page.locator('.question-scroll').filter({ hasText: 'pushed his chair back' });
  await expect(prompt).toBeVisible();
  expect(((await prompt.innerText()).match(/\(stand\)/g) ?? []).length).toBe(1);
});

test('a long typed answer stays inside the question pane', async ({ page }) => {
  await page.goto('/#/p/ci-zk/ci-zk-w13-fri');
  await showQuestions(page);
  await lastPage(page); // 第 14 题, the item's last page
  await expect(page.locator('.question-scroll')).toContainText('He hoped these classes');
  await page.locator('.question-scroll .blank-input input').last().fill('would help more people learn to express their ideas');
  const { sw, cw } = await page.locator('.question-scroll').evaluate((s) => ({ sw: s.scrollWidth, cw: s.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
});

test('a photo printed on the continuation page is shown with the article', async ({ page }) => {
  await page.goto('/#/p/ci-g7/ci-g7-w10-mon');
  const img = page.locator('.article img[src$="ci-g7-w10-mon-1.jpg"]');
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});

test('words highlighted on the continuation page are highlighted and listed (ci-g7-w03-mon)', async ({ page }) => {
  await page.goto('/#/p/ci-g7/ci-g7-w03-mon');
  await expect(page.locator('.article .rt-vocab', { hasText: 'regulations' })).toBeVisible();
  await expect(page.locator('.words-head')).toContainText(['regulation', 'issue']);
});
