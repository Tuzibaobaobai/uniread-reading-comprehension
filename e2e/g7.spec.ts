// 7年级 new question types: 句型转换 (textEntry scoring "all") and 连词成句 (order).
// Screens → .work/screens/<project>/5-g7-*.png
import { expect, test, type Page } from '@playwright/test';

const narrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;
const openQuestion = async (page: Page, n: number) => {
  await page.goto('/#/p/ci-g7/ci-g7-w01-fri');
  if (narrow(page)) await page.getByRole('tab', { name: /题目/ }).click();
  await page.getByRole('button', { name: new RegExp(`^第 ${n} 题`) }).click();
};

test('句型转换: every blank in the frame is typed', async ({ page }, info) => {
  await openQuestion(page, 13);
  await expect(page.locator('.section-instruction')).toHaveText('III. Complete the following sentences as required.');
  await expect(page.locator('.q-prompt')).toContainText('改为被动语态');
  const inputs = page.locator('.q-prompt input');
  await expect(inputs).toHaveCount(3);
  await inputs.nth(0).fill('are');
  await inputs.nth(1).fill('turned');
  await inputs.nth(2).fill('into');
  await page.screenshot({ path: `.work/screens/${info.project.name}/5-g7-transform.png` });
});

test('连词成句: tap chunks to build the sentence, tap again to undo', async ({ page }, info) => {
  await openQuestion(page, 17);
  const order = ['eating', 'too many', 'deep-fried foods', 'is', 'very', 'likely', 'to', 'affect', 'our', 'health'];
  for (const w of order) await page.locator('.order-pool .order-chip', { hasText: new RegExp(`^${w}$`) }).click();
  await expect(page.locator('.order-line')).toHaveText('Eatingtoo manydeep-fried foodsisverylikelytoaffectourhealth.');
  // undo one chunk
  await page.locator('.order-line .order-chip', { hasText: /^health$/ }).click();
  await expect(page.locator('.order-pool .order-chip')).toHaveCount(1);
  await page.locator('.order-pool .order-chip', { hasText: /^health$/ }).click();
  await page.screenshot({ path: `.work/screens/${info.project.name}/5-g7-order.png` });

  // submit and check it is graded correct
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.getByRole('button', { name: /^第 17 题/ }).click();
  await expect(page.locator('.order-line')).toHaveClass(/is-correct/);
  await expect(page.locator('.explain')).toContainText('Eating too many deep-fried foods is very likely to affect our health.');
  await page.screenshot({ path: `.work/screens/${info.project.name}/5-g7-order-review.png` });
});

test('section instruction above every question (I. Answer the questions.)', async ({ page }) => {
  await openQuestion(page, 2);
  await expect(page.locator('.section-instruction')).toHaveText('I. Answer the questions.');
});
