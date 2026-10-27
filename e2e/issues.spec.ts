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
  await page.goto('/#/p/ci-g5/ci-g5-w06-thu');
  await showQuestions(page);
  await page.getByRole('textbox', { name: /空格 1/ }).fill('nventor');
  await page.getByRole('button', { name: '下一题' }).click();
  await expect(page.locator('.stimulus .context-blank').first()).toHaveText('inventor');
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

test('#9 resource names show only the title', async ({ page }) => {
  await page.goto('/#/p/ci-g7');
  await expect(page.locator('.item-row-title').first()).toHaveText('Bye Bye, Balltze');
  await page.goto('/#/p/ci-g7/ci-g7-w01-mon');
  await expect(page.locator('.reader-head-title')).toHaveText('Bye Bye, Balltze');
});

test('#10 filled answers are coloured differently from highlighted words', async ({ page }) => {
  await page.goto('/#/p/ci-g7/ci-g7-w01-thu');
  await showQuestions(page);
  await page.locator('.bank-entry', { hasText: 'control' }).click();
  if (narrow(page)) await page.getByRole('tab', { name: '文章' }).click();
  const filled = await page.locator('.blank-chip .blank-chip-text').first().evaluate((el) => getComputedStyle(el).color);
  const vocab = await page.locator('.rt-vocab').first().evaluate((el) => getComputedStyle(el).color);
  expect(filled).not.toBe(vocab);
});

test('#11 word-bank blanks show only the option letter', async ({ page }, info) => {
  await page.goto('/#/p/ci-g7/ci-g7-w01-thu');
  await showQuestions(page);
  await page.getByRole('button', { name: /^第 2 题/ }).click();
  await page.locator('.bank-entry', { hasText: 'master' }).click();
  await page.getByRole('button', { name: /^第 2 题/ }).click();
  await expect(page.locator('.question-scroll .gap-slot').first()).toHaveText('I');
  if (narrow(page)) await page.getByRole('tab', { name: '文章' }).click();
  await expect(page.locator('.blank-chip').nth(1)).toContainText('I');
  await expect(page.locator('.blank-chip').nth(1)).not.toContainText('master');
  await shot(page, info.project.name, '11-letter');
});

test('#12 underlined phrases are one continuous line', async ({ page }) => {
  await page.goto('/#/p/ci-g7/ci-g7-w01-tue');
  const u = page.locator('.rt-underline').first();
  await expect(u).toHaveText('beat swords into plowshares');
  await expect(u).toHaveCSS('text-decoration-skip-ink', 'none');
});

test('#98 a rubric that already starts with 要点 is not labelled twice', async ({ page }) => {
  await page.goto('/#/p/ci-xsc3/ci-xsc3-w01-fri');
  await showQuestions(page);
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.locator('.question-dot').first().click();
  await expect(page.locator('.explain-text').first()).toBeVisible();
  for (const dot of await page.locator('.question-dot').all()) {
    await dot.click();
    await expect(page.locator('.question-card')).not.toContainText('要点：要点');
    await expect(page.locator('.question-card')).not.toContainText('官方答案');
  }
});

test('#93 a word first printed in the title is highlighted where it first appears in the text', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-wed');
  await expect(page.locator('.article-body [data-block="p1"] .rt-vocab').first()).toHaveText('pet');
});

test('#99 back buttons use the Figma SVG icon', async ({ page }) => {
  for (const path of ['/#/p/ci-g3', '/#/p/ci-g3/ci-g3-w01-wed']) {
    await page.goto(path);
    await expect(page.locator('.back-button svg.back-icon')).toHaveCount(1);
    await expect(page.locator('.back-button img')).toHaveCount(0);
  }
});

test('#107 a page waiting for its data shows the shared Loading mask, then removes it', async ({ page }) => {
  await page.route('**/playlists/ket1/items/ket1-t1-rw.json', async (r) => {
    await new Promise((x) => setTimeout(x, 1200));
    await r.continue();
  });
  await page.goto('/#/p/ket1/ket1-t1-rw');
  await expect(page.locator('[role=status][aria-busy=true]')).toBeVisible();
  await expect(page.locator('[role=status][aria-busy=true]')).toHaveCount(0, { timeout: 5000 });
  await expect(page.getByRole('button', { name: /练习模式/ })).toBeVisible();
});

test('#108 every 时文阅读 item uses the Week-Day card as its cover, not the article picture', async ({ page }) => {
  await page.goto('/#/p/ci-g7');
  await expect(page.locator('.item-row').first()).toBeVisible();
  await expect(page.locator('.item-row-thumb.text-thumb')).toHaveCount(await page.locator('.item-row').count());
  await expect(page.locator('img.item-row-thumb')).toHaveCount(0);
});

test('#119 时文阅读 difficulty labels follow the series grade (8年级 → L8, 中考 → L9)', async ({ page }) => {
  await page.goto('/#/p/ci-g8');
  await expect(page.locator('.playlist-intro-stats')).toContainText('L8');
  await expect(page.locator('.playlist-intro-stats')).not.toContainText('~');
  await page.goto('/#/');
  await expect(page.locator('.playlist-card', { hasText: '中考' }).locator('.playlist-card-meta')).toContainText('L9');
});

test('#126 a glossed word is printed once; the word box shows above each 选词填空 sentence', async ({ page }) => {
  await page.goto('/#/p/ci-g8/ci-g8-w05-fri');
  await expect(page.locator('.article-body')).toContainText('will cause a hammer ( 音槌 ) to strike');
  await expect(page.locator('.article-body')).not.toContainText('hammer hammer');
  await showQuestions(page);
  await page.locator('.question-dot').nth(6).click();
  await expect(page.locator('.stimulus.is-box')).toContainText('inventor');
});

test('#127 table-fill: the book table on one page — face dropdowns, text boxes marked ✓ / ✗ by the AI, P1 → right/total', async ({ page }) => {
  // mocked judge: cell 2 right, every other written cell wrong
  await page.route('**/api/rc/judge', async (route) => {
    const { questionId } = route.request().postDataJSON() as { questionId: string };
    const ok = questionId === 'q2';
    await route.fulfill({
      json: {
        score: ok ? 1 : 0, maxPoints: 1, keyPoints: [{ id: 'k1', met: ok ? 'yes' : 'no' }], languageIssues: [],
        feedbackZh: ok ? '抄对了线索。' : '再到原文找一找。', confidence: 0.9, flags: [], needsReview: false,
        model: 'mock', promptVersion: 'mock', judgedAt: new Date().toISOString(),
      },
    });
  });
  await page.goto('/#/p/ci-g8/ci-g8-w18-thu');
  await showQuestions(page);
  const table = page.locator('.section-table .rt-table');
  await expect(table).toContainText('How did the person feel?');
  await expect(table.locator('td', { hasText: '①' })).toHaveCount(2);
  await expect(table.locator('td', { hasText: '②' })).toHaveCount(2);
  await expect(page.locator('.cell-select-button')).toHaveCount(8);
  await expect(page.locator('.cell-text-input')).toHaveCount(16);
  await expect(page.locator('.question-dot')).toHaveCount(1);
  await expect(page.locator('.question-dot')).toContainText('P1');
  await expect(page.locator('select')).toHaveCount(0);
  await page.locator('.cell-select-button').first().click();
  await expect(page.locator('.cell-select-item')).toHaveText(['🙂', '☹', '😐']);
  await page.locator('.cell-select-item').first().click();
  await expect(page.locator('.cell-select-button').first()).toContainText('🙂');
  // Nick before the meal: ☹ and 😐 are both accepted
  await page.locator('.cell-select-button').nth(1).click();
  await page.locator('.cell-select-item').nth(2).click();
  await page.locator('.cell-text-input').first().fill('For years, I had wanted to eat at the restaurant.');
  await page.locator('.cell-text-input').nth(1).fill('A boring place');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('RC Emoticon');
  expect(await page.evaluate(async () => (await document.fonts.load('16px "RC Emoticon"', '☹')).length)).toBeGreaterThan(0);
  await page.getByRole('button', { name: '提交' }).click();
  const confirm = page.getByRole('button', { name: '仍然提交' });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await expect(page.locator('.part-explain li')).toHaveCount(24);
  await expect(page.locator('.cell-select-button').nth(0)).toHaveClass(/is-correct/);
  await expect(page.locator('.cell-select-button').nth(1)).toHaveClass(/is-correct/);
  await expect(page.locator('.cell-text').nth(0)).toHaveClass(/is-correct/);
  await expect(page.locator('.cell-text').nth(1)).toHaveClass(/is-wrong/);
  await expect(page.locator('.question-dot .is-score')).toHaveText('3/24');
});
