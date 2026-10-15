// Visual check of review mode → .work/screens/<project>/3-review-*.png
import { test } from '@playwright/test';

test('review screens', async ({ page }, info) => {
  const dir = `.work/screens/${info.project.name}`;
  const narrow = (page.viewportSize()?.width ?? 1440) < 1024;
  await page.goto('/#/p/ci-g3/ci-g3-w01-thu');
  if (narrow) await page.getByRole('tab', { name: /题目/ }).click();
  await page.locator('.bank-entry', { hasText: 'decided' }).click();
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dir}/3-review-wordbank.png` });
  if (narrow) {
    await page.getByRole('tab', { name: '文章' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/3-review-wordbank-article.png` });
  }
});

test('review screens: choice', async ({ page }, info) => {
  const dir = `.work/screens/${info.project.name}`;
  const narrow = (page.viewportSize()?.width ?? 1440) < 1024;
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  if (narrow) await page.getByRole('tab', { name: /题目/ }).click();
  await page.getByRole('radio', { name: /Real babies/ }).click();
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dir}/3-review-choice.png` });
});
