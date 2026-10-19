// KET 真题 (exam papers): mode choice, tap-only answering, exam-mode audio, transcript after submitting, report.
import { expect, test, type Page } from '@playwright/test';

const narrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;
const tab = async (page: Page, name: RegExp) => {
  if (narrow(page)) await page.getByRole('tab', { name }).click();
};

test('playlist groups the papers by test', async ({ page }) => {
  await page.goto('/#/p/ket1');
  await expect(page.locator('.week-label').first()).toHaveText('第 1 套');
  await expect(page.locator('.item-row-title').first()).toHaveText('KET真题1-第1套-阅读与写作');
});

test('listening, exam mode: picture options by tap, locked recording, report and transcript after submitting', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-l');
  await page.getByRole('button', { name: /考试模式/ }).click();
  await expect(page.locator('.exam-timer')).toContainText('剩余');
  // recording: no seeking, no skip buttons in exam mode
  await tab(page, /材料/);
  await expect(page.getByRole('slider', { name: '播放进度' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /后退/ })).toHaveCount(0);
  // the transcript is private until submitting
  await expect(page.locator('.transcript')).toHaveCount(0);
  await tab(page, /题目/);
  await expect(page.locator('.options.has-images .option-image')).toHaveCount(3);
  await page.locator('.option').nth(2).click(); // Q1 = C
  await page.getByRole('button', { name: '标记本题' }).click();
  await expect(page.locator('.question-dot.is-flagged')).toHaveCount(1);
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await expect(page.getByRole('dialog', { name: '成绩报告' })).toContainText('原始分 1 / 25');
  await page.getByRole('button', { name: '查看答案与解析' }).click();
  await expect(page.locator('.question-dot.is-correct')).toHaveCount(1);
  await tab(page, /材料/);
  await expect(page.locator('.transcript')).toContainText('How did Stan and his dad get home from the concert?');
});

test('reading & writing: notice in the left pane, open cloze by typing, word counter', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-rw');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /材料/);
  await expect(page.locator('.exam-q-material img')).toHaveCount(1);
  await tab(page, /题目/);
  await page.locator('.question-dot', { hasText: '25' }).click();
  await page.locator('.blank-input input').first().fill('the');
  await page.locator('.question-dot', { hasText: '31' }).click();
  await page.locator('textarea').fill('Dear Lee, we are going camping. Come with us!');
  await expect(page.locator('.word-count')).toHaveText('已写 9 词 · 至少 25 词');
});

test('exam mode ends by itself when the time is up', async ({ page }) => {
  await page.clock.install();
  await page.goto('/#/p/ket1/ket1-t1-s');
  await page.getByRole('button', { name: /考试模式/ }).click();
  await page.clock.fastForward('10:01');
  await expect(page.getByRole('dialog', { name: '成绩报告' })).toBeVisible();
});
