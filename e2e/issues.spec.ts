// Regression tests for GitHub issues #1–#6 (新题型内容审核). Screens → .work/screens/<project>/4-issue-*.png
import { expect, test, type Page } from '@playwright/test';

const narrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;
const showQuestions = async (page: Page) => {
  if (narrow(page)) await page.getByRole('tab', { name: /题目/ }).click();
};
const shot = (page: Page, project: string, name: string) => page.screenshot({ path: `.work/screens/${project}/4-issue-${name}.png` });

test('#1 定位原文 highlights the sentence, not the paragraph', async ({ page }, info) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  await showQuestions(page);
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.getByRole('button', { name: '定位原文' }).click();
  const text = await page.evaluate(() => {
    const h = (CSS as unknown as { highlights: Map<string, Set<Range>> }).highlights.get('evidence');
    return h ? [...h].map((r) => r.toString()).join(' | ') : '';
  });
  expect(text).toContain('They are made from stem cells');
  expect(text).toContain('cannot grow into a person.');
  expect(text).not.toContain('Scientists say');
  await expect(page.locator('.is-evidence')).toHaveCount(0);
  await shot(page, info.project.name, '1-locate');
});

test('#2 first-letter blanks keep the letter after answering', async ({ page }, info) => {
  await page.goto('/#/p/ci-xsc/ci-xsc-w12-thu');
  await showQuestions(page);
  await page.getByRole('textbox', { name: /空格 1/ }).fill('armer');
  await page.getByRole('button', { name: '下一题' }).click();
  await expect(page.locator('.stimulus .context-blank').first()).toHaveText('warmer');
  await shot(page, info.project.name, '2-first-letter');
});

test('#3 title has no Chinese translation', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  await expect(page.locator('.article-title')).toBeVisible();
  await expect(page.locator('.article-title-zh')).toHaveCount(0);
  await expect(page.getByText('微型“胚胎”开启太空试验')).toHaveCount(0);
});

test('#4 blanks are a single underline', async ({ page }, info) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-wed');
  await showQuestions(page);
  const blank = page.locator('.context-blank').first();
  await expect(blank).not.toContainText('_');
  const style = await blank.evaluate((el) => {
    const c = getComputedStyle(el);
    return { top: c.borderTopStyle, bottom: c.borderBottomStyle, bg: c.backgroundColor };
  });
  expect(style.top).toBe('none');
  expect(style.bottom).toBe('solid');
  await shot(page, info.project.name, '4-cloze');
});

test('#5 true/false shows only T and F', async ({ page }, info) => {
  await page.goto('/#/p/ci-g3/ci-g3-w04-thu');
  await showQuestions(page);
  await expect(page.locator('.option .option-text')).toHaveText(['T', 'F']);
  await shot(page, info.project.name, '5-tf');
});

test('#6 question number sits on the prompt baseline', async ({ page }, info) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-fri');
  await showQuestions(page);
  const prompt = page.locator('.q-prompt').first();
  await expect(prompt).toHaveCSS('align-items', 'baseline');
  await shot(page, info.project.name, '6-prompt');
});

test('#7 no result header; every question shows its section instruction', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  await showQuestions(page);
  await expect(page.locator('.section-instruction')).toHaveText('Choose the best answer.');
  await expect(page.locator('.q-prompt')).toContainText('What are the');
  await page.getByRole('button', { name: '下一题' }).click();
  await expect(page.locator('.section-instruction')).toHaveText('Choose the best answer.');
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await expect(page.locator('.result')).toHaveCount(0);
  await expect(page.getByText(/正确率/)).toHaveCount(0);
});

test('#8 scrollbars stay inside the rounded corners', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  if (narrow(page)) return; // article and questions are tabs; same CSS applies
  await expect(page.locator('.article-scroll')).toBeVisible();
  const gap = await page.evaluate(() => {
    const pane = document.querySelector('.article-pane')!.getBoundingClientRect();
    const scroller = document.querySelector('.article-scroll')!.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(document.querySelector('.article-pane')!).borderTopRightRadius);
    return { top: scroller.top - pane.top, bottom: pane.bottom - scroller.bottom, radius };
  });
  expect(gap.top).toBeGreaterThanOrEqual(gap.radius);
  expect(gap.bottom).toBeGreaterThanOrEqual(gap.radius);
});
