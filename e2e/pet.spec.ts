// PET 真题 (B1 Preliminary): separate Reading / Writing papers, annotated email, choose-one writing task, AI partner.
import { expect, test, type Page } from '@playwright/test';

const narrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;
const tab = async (page: Page, name: RegExp) => {
  if (narrow(page) && (await page.locator('.reader-body.no-left').count()) === 0) await page.getByRole('tab', { name }).click();
};
const practice = async (page: Page, id: string) => {
  await page.goto(`/#/p/pet1/${id}`);
  await page.getByRole('button', { name: /练习模式/ }).click();
};

test('playlist: four papers per test, PET cover and B1 level', async ({ page }) => {
  await page.goto('/#/p/pet1');
  await expect(page.locator('.item-row-title').nth(0)).toHaveText('PET真题1-第1套-阅读');
  await expect(page.locator('.item-row-title').nth(1)).toHaveText('PET真题1-第1套-写作');
  await expect(page.locator('.item-row-title').nth(2)).toHaveText('PET真题1-第1套-听力');
  await expect(page.locator('.item-row-title').nth(3)).toHaveText('PET真题1-第1套-口语');
  await expect(page.locator('.test-score').first()).toHaveText('成绩：待完成所有考试');
});

test('writing Part 1: the email shows the handwritten notes as callouts', async ({ page }) => {
  await practice(page, 'pet1-t1-w');
  await tab(page, /材料/);
  await expect(page.locator('.rt-callout').first()).toBeVisible();
  expect(await page.locator('.rt-callout').count()).toBeGreaterThanOrEqual(3);
});

test('writing Part 2: choose one task; switching after writing asks and clears; only that task is scored', async ({ page }) => {
  await practice(page, 'pet1-t1-w');
  await tab(page, /题目/);
  await page.getByRole('button', { name: '下一题' }).click();
  const cards = page.locator('.task-card');
  await expect(cards).toHaveCount(2);
  await expect(page.locator('textarea')).toHaveCount(0); // nothing chosen yet
  await cards.nth(0).click();
  await page.locator('textarea').fill('Sport is very popular at my school, and there are many clubs for young people.');
  await cards.nth(1).click();
  await expect(page.getByRole('alertdialog')).toContainText('已经写的内容会被清空');
  await page.getByRole('button', { name: '切换并清空' }).click();
  await expect(page.locator('textarea')).toHaveValue('');
  await page.locator('textarea').fill('Lois smiled as she put the tickets in her pocket and walked out of her house.');
  await expect(page.locator('.question-dot').last().locator('.question-dot-mark')).toBeVisible();
  // the server scores only the chosen task
  const graded = await page.request.post('/api/rc/grade', {
    data: { itemId: 'pet1-t1-w', responses: { q1: 'Dear Mrs Hallam', q3: 'Lois smiled…' } },
  });
  const { result } = await graded.json();
  expect(result.byQuestion.map((b: { q: string; scoredBy?: string }) => [b.q, b.scoredBy])).toEqual([
    ['q1', 'pending'],
    ['q2', 'none'],
    ['q3', 'pending'],
  ]);
});

test('speaking Part 3: the AI partner speaks with its own voice and the learner replies', async ({ page }) => {
  await practice(page, 'pet1-t1-s');
  await tab(page, /题目/);
  await page.getByRole('button', { name: /Part 3 第/ }).first().click();
  await page.getByRole('button', { name: '下一题' }).click();
  await expect(page.locator('.speak-role.is-partner')).toHaveText('搭档 Alex');
  const audio = page.waitForRequest((r) => /pet1-t1-s-q3-t2\.mp3$/.test(r.url()));
  await page.getByRole('button', { name: '听搭档' }).click();
  await audio;
  await expect(page.getByRole('button', { name: '回答' })).toBeVisible();
});

test('#82 reading Part 2: all five people on one page, letters A–H, each letter used once', async ({ page }) => {
  await practice(page, 'pet1-t1-r');
  await tab(page, /题目/);
  await page.getByRole('button', { name: /第 6–10 题/ }).click();
  await expect(page.locator('.match-row')).toHaveCount(5);
  const row = (n: number) => page.locator('.match-row').nth(n);
  await row(0).getByRole('radio', { name: /^F / }).click();
  await row(1).getByRole('radio', { name: /^F / }).click(); // F moves from Q6 to Q7
  await expect(row(0).locator('.match-row-letter.is-on')).toHaveCount(0);
  await expect(row(1).locator('.match-row-letter.is-on')).toHaveText('F');
  await expect(row(0).locator('.match-row-letter.is-used')).toContainText('F');
  await tab(page, /材料/);
  await expect(page.locator('.rt-note')).toHaveCount(8);
});
