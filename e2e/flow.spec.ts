import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const playlistCount = JSON.parse(readFileSync('content/catalog.json', 'utf8')).playlists.length;

const narrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;
const showQuestions = async (page: Page) => {
  if (narrow(page)) await page.getByRole('tab', { name: /题目/ }).click();
};

test('playlists → playlist → item list', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.playlist-card')).toHaveCount(playlistCount);
  await page.locator('.playlist-card').first().click();
  await expect(page.getByText(/合集（\d+）/)).toBeVisible();
  await expect(page.locator('.item-row-title', { hasText: 'Tiny “Embryos” Begin Space Test' })).toBeVisible();
});

test('multiple choice: answer, unanswered warning, submit, review, restore', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  await expect(page.locator('.article-title')).toHaveText('Tiny “Embryos” Begin Space Test');
  await showQuestions(page);
  await page.getByRole('radio', { name: /Stem cells/ }).click();
  await page.getByRole('button', { name: '下一题' }).click();
  await page.getByRole('radio', { name: /To study how early human cells/ }).click();
  await page.getByRole('button', { name: '下一题' }).click();
  await page.getByRole('button', { name: '提交' }).click();
  await expect(page.getByRole('dialog')).toContainText('还有 1 题没有作答');
  await page.getByRole('button', { name: '继续作答' }).click();
  await page.getByRole('radio', { name: /They will return to Earth/ }).click();
  await page.getByRole('button', { name: '提交' }).click();
  // #7: no score header — results show in the pager
  await expect(page.locator('.result')).toHaveCount(0);
  await expect(page.locator('.question-dot.is-correct')).toHaveCount(3);
  // choice explanation is embedded in the correct option (Figma Option-text-item, correct-expanded)
  await expect(page.locator('.option.is-correct .option-explain-text')).not.toBeEmpty();

  await page.reload();
  await expect(page.locator('.question-dot.is-correct')).toHaveCount(3);
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '重新作答' }).click();
  await expect(page.locator('.question-dot.is-correct')).toHaveCount(0);
});

test('cloze: left blank chips sync with right-side answers', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-wed');
  await showQuestions(page);
  await page.getByRole('radio', { name: /family/ }).click();
  if (narrow(page)) await page.getByRole('tab', { name: '文章' }).click();
  await expect(page.locator('.blank-chip').first()).toContainText('family');
  // tapping another blank jumps to its question
  await page.locator('.blank-chip').nth(2).click();
  await expect(page.locator('.q-prompt')).toContainText('第 3 空');
});

test('word bank: entries are used once', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-thu');
  await showQuestions(page);
  await page.locator('.bank-entry', { hasText: 'decided' }).click();
  await page.getByRole('button', { name: '下一题' }).click();
  await page.locator('.bank-entry', { hasText: 'decided' }).click();
  await page.getByRole('button', { name: '上一题' }).click();
  await expect(page.locator('.bank-entry.is-here')).toHaveCount(0);
});

test('true/false', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w04-thu');
  await showQuestions(page);
  await page.getByRole('radio', { name: /False/ }).click();
  await expect(page.getByRole('radio', { name: /False/ })).toBeChecked();
});

test('matching', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w03-thu');
  await showQuestions(page);
  const left = page.locator('.match-col').first().locator('.match-item');
  const right = page.locator('.match-col').nth(1).locator('.match-item');
  await left.nth(0).click();
  await right.nth(1).click();
  await expect(left.nth(0).locator('.match-badge')).toHaveText('B');
});

test('table fill: typed answers', async ({ page }) => {
  await page.goto('/#/p/ci-g5/ci-g5-w06-thu');
  await showQuestions(page);
  const input = page.locator('.blank-input input').first();
  await input.fill('nventor');
  await expect(input).toHaveValue('nventor');
});

test('answer keys are not published as static files; grading goes through the API', async ({ page, request }) => {
  expect((await request.get('/playlists/ci-g3/keys/ci-g3-w01-mon.json')).status()).toBe(404);
  expect((await request.get('/playlists/ci-g3/items/ci-g3-w01-mon.json')).status()).toBe(200);
  const graded = page.waitForRequest((r) => r.url().endsWith('/api/rc/grade') && r.method() === 'POST');
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  await showQuestions(page);
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await graded;
  await expect(page.locator('.question-dot.is-wrong')).toHaveCount(3);
});

test('grading service down: answers are kept and the message says so', async ({ page }) => {
  await page.route('**/api/rc/grade', (route) => route.fulfill({ status: 404, body: 'NOT_FOUND' }));
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  await showQuestions(page);
  await page.getByRole('radio', { name: /Stem cells/ }).click();
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await expect(page.getByRole('alert')).toContainText('判分服务暂时不可用（404）');
  await expect(page.locator('.question-dot.is-answered')).toHaveCount(1);
});

test('restore: answers and the last viewed (unanswered) question survive a reload', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  await showQuestions(page);
  await page.getByRole('radio', { name: /Stem cells/ }).click();
  await page.getByRole('button', { name: /^第 3 题/ }).click(); // unanswered
  await page.reload();
  await showQuestions(page);
  await expect(page.locator('.question-dot.is-current')).toHaveAccessibleName(/^第 3 题/);
  await expect(page.locator('.question-dot.is-answered')).toHaveCount(1);
  await page.getByRole('button', { name: /^第 1 题/ }).click();
  await expect(page.getByRole('radio', { name: /Stem cells/ })).toHaveAttribute('aria-checked', 'true');
});

test('picture options: images render and can be chosen', async ({ page }) => {
  await page.goto('/#/p/ci-g8/ci-g8-w09-tue');
  await showQuestions(page);
  await page.locator('.question-dot').nth(2).click();
  const imgs = page.locator('.option-image');
  await expect(imgs).toHaveCount(4);
  await expect(imgs.first()).toHaveJSProperty('complete', true);
  expect(await imgs.first().evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('radio', { name: /straw/ }).click();
  await expect(page.getByRole('radio', { name: /straw/ })).toHaveAttribute('aria-checked', 'true');
});

test('question strip: many questions show "more" buttons with counts and page sideways', async ({ page }) => {
  await page.goto('/#/p/ci-zk/ci-zk-w03-fri'); // 18 questions (ci-g8-w18-thu's 24 became one table page, #127)
  await showQuestions(page);
  const right = page.locator('.strip-more-right');
  await expect(right).toBeVisible();
  await expect(right).toContainText(/\+\d+/);
  await expect(page.locator('.strip-more-left')).toHaveCount(0);
  await right.click();
  await expect(page.locator('.strip-more-left')).toBeVisible();
  // the last question can always be reached and is scrolled into view
  await page.locator('.question-dot').last().click();
  await expect(page.locator('.question-dot').last()).toBeInViewport();
  await expect(page.locator('.strip-more-right')).toHaveCount(0);
});

test('question strip: few questions show no "more" buttons', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  await showQuestions(page);
  await expect(page.locator('.question-dot')).toHaveCount(3);
  await expect(page.locator('.strip-more')).toHaveCount(0);
});
