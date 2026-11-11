// PET 真题 (B1 Preliminary): separate Reading / Writing papers, annotated email, choose-one writing task, AI partner.
import { expect, test, type Page } from '@playwright/test';
import { goQuestion, lastPage, numbers, openPart } from './nav';

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
  await page.route('**/api/rc/judge', (route) =>
    route.fulfill({
      json: {
        score: 0, maxPoints: 20,
        keyPoints: ['content', 'communicative_achievement', 'organisation', 'language'].map((id) => ({ id, met: 'no', band: 0 })),
        languageIssues: [], feedbackZh: '这次的回答看起来不是英文句子。', confidence: 0.9, flags: [], needsReview: false,
        model: 'mock', promptVersion: 'mock', judgedAt: new Date().toISOString(),
      },
    }),
  );
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
  await expect(numbers(page).last()).toHaveClass(/is-answered/);
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
  await openPart(page, 3);
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
  await goQuestion(page, /第 6 题/);
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

test('#90 #91 #92 reading Part 2: lead-in above the questions, photos, every question\'s evidence after submitting', async ({ page }) => {
  await practice(page, 'pet1-t1-r');
  await tab(page, /题目/);
  await goQuestion(page, /第 6 题/);
  await expect(page.locator('.section-intro')).toContainText('The young people below');
  await expect(page.locator('.match-row-photo')).toHaveCount(5);
  await tab(page, /材料/);
  await expect(page.locator('.exam-pane')).not.toContainText('The young people below');
  await tab(page, /题目/);
  await lastPage(page);
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.getByRole('button', { name: '查看答案与解析' }).click();
  await goQuestion(page, /第 6 题/);
  await expect(page.locator('.part-explain-locate')).toHaveCount(5);
  // #100: nothing is highlighted until one question's 定位原文 is tapped, then only that question's evidence
  const ranges = () => page.evaluate(() => (CSS as unknown as { highlights?: Map<string, { size: number }> }).highlights?.get('evidence')?.size ?? -1);
  if ((await ranges()) < 0) return; // no CSS Custom Highlight API
  expect(await ranges()).toBe(0);
  await page.locator('.part-explain-locate').nth(2).click();
  await expect.poll(ranges).toBe(1);
  await expect.poll(() => page.evaluate(() => [...(CSS as unknown as { highlights: Map<string, Set<Range>> }).highlights.get('evidence')!][0].toString())).toContain('One-to-one');
});

test('#96 writing: genre layouts — email header band, the announcement box inside the article task', async ({ page }) => {
  await practice(page, 'pet1-t1-w');
  await tab(page, /材料/);
  await expect(page.locator('.rt-note.is-email .rt-note-field-label')).toHaveText(['From:', 'To:', 'Subject:']);
  await tab(page, /题目/);
  await page.getByRole('button', { name: '下一题' }).click();
  await page.locator('.task-card').nth(0).click();
  await expect(page.locator('.task-stimulus .rt-note.is-notice .rt-note-title')).toHaveText('Articles wanted!');
  await expect(page.locator('.task-stimulus .rt-note-heading')).toHaveText('Sport and exercise');
  await expect(page.locator('.task-line strong').first()).toHaveText('article');
});

test('PET 校园版真题 2 and 3: four tests each, grouped by test, all papers open', async ({ page }) => {
  for (const pl of ['pet2', 'pet3']) {
    await page.goto(`/#/p/${pl}`);
    await expect(page.locator('.item-row-title')).toHaveCount(16);
    await expect(page.locator('.item-row-title').nth(15)).toHaveText(`PET真题${pl.slice(-1)}-第4套-口语`);
  }
  await practice(page, 'pet3-t4-r');
  await tab(page, /题目/);
  await expect(page.locator('.question-card')).toBeVisible();
});

test('#101 the three recordings supplied later are in: every Part of PET 2 Tests 1 and 4 has its player', async ({ page }) => {
  for (const id of ['pet2-t1-l', 'pet2-t4-l']) {
    await practice(page, id);
    await tab(page, /材料/);
    await expect(page.locator('.part-audio')).toHaveCount(4);
    await expect(page.getByText('本部分录音暂缺')).toHaveCount(0);
    await expect(page.locator('.part-audio .player')).toHaveCount(4);
  }
});

test('#128 writing is marked with a score only: the pager shows 18/20, no ✗', async ({ page }) => {
  await page.route('**/api/rc/judge', (route) =>
    route.fulfill({
      json: {
        score: 18, maxPoints: 20,
        keyPoints: ['content', 'communicative_achievement', 'organisation', 'language'].map((id) => ({ id, met: 'yes', band: 4 })).map((k, i) => (i < 2 ? { ...k, band: 5 } : k)),
        languageIssues: [], feedbackZh: '写得很好。', confidence: 0.9, flags: [], needsReview: false,
        model: 'mock', promptVersion: 'mock', judgedAt: new Date().toISOString(),
      },
    }),
  );
  await practice(page, 'pet1-t1-w');
  await tab(page, /题目/);
  await page.locator('textarea').fill('Dear Mrs Hallam, thank you for your email. I would love to come to the concert with my class.');
  await page.getByRole('button', { name: '下一题' }).click();
  await page.locator('.task-card').nth(1).click();
  await page.locator('textarea').fill('Lois smiled as she put the tickets in her pocket and walked out of her house.');
  await page.getByRole('button', { name: '提交' }).click();
  const confirm = page.getByRole('button', { name: '仍然提交' });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await expect(page.locator('.judge-score').first()).toContainText('18');
  await expect(page.locator('.part-nav').locator('.is-wrong')).toHaveCount(0);
  await expect(page.locator('.part-nav').locator('.is-correct')).toHaveCount(0);
  // #128 comment: a judged Part shows score / full marks in the pager
  // the other Part's card and the current Part's number
  await expect(page.locator('.part-nav').locator('.part-result-count, .part-q-score')).toHaveText(['18/20', '18/20']);
  await expect(page.locator('.explain .explain-head').first()).toHaveText('得分 18 / 20');
});

test('#128 (2026-11-05) a 0/20 writing answer: the pager shows 0/20, never ✗, and no 回答错误 verdict', async ({ page }) => {
  await page.route('**/api/rc/judge', (route) =>
    route.fulfill({
      json: {
        score: 0, maxPoints: 20,
        keyPoints: ['content', 'communicative_achievement', 'organisation', 'language'].map((id) => ({ id, met: 'no', band: 0 })),
        languageIssues: [], feedbackZh: '这次的回答看起来不是英文句子。', confidence: 0.9, flags: [], needsReview: false,
        model: 'mock', promptVersion: 'mock', judgedAt: new Date().toISOString(),
      },
    }),
  );
  await practice(page, 'pet1-t1-w');
  await tab(page, /题目/);
  await page.locator('textarea').fill('ssss');
  await page.getByRole('button', { name: '下一题' }).click();
  await page.locator('.task-card').nth(1).click();
  await page.locator('textarea').fill('ssss');
  await page.getByRole('button', { name: '提交' }).click();
  const confirm = page.getByRole('button', { name: '仍然提交' });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await expect(page.locator('.part-nav').locator('.part-result-count, .part-q-score')).toHaveText(['0/20', '0/20']);
  await expect(page.locator('.part-nav').locator('.is-wrong')).toHaveCount(0);
  await expect(page.locator('.explain .explain-head').first()).toHaveText('得分 0 / 20');
  await expect(page.getByText('回答错误')).toHaveCount(0);
});

test('speaking: the full mark is B1 Preliminary’s own 30 in the mode dialog', async ({ page }) => {
  await page.goto('/#/p/pet1/pet1-t1-s');
  await expect(page.locator('.mode-dialog')).toContainText('满分 30 分');
});

test('writing: the sample answer is a real candidate’s script — shown with the examiner’s mark and comment', async ({ page }) => {
  await page.route('**/api/rc/judge', (route) => route.fulfill({ status: 503, body: 'judge not configured' }));
  await practice(page, 'pet1-t1-w');
  await tab(page, /题目/);
  await page.locator('textarea').fill('Dear Mrs Hallam, I think the talent show is a good idea.');
  await page.getByRole('button', { name: '下一题' }).click();
  await page.getByRole('button', { name: '提交' }).click();
  const confirm = page.getByRole('button', { name: '仍然提交' });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.getByRole('button', { name: '查看答案与解析' }).click();
  await goQuestion(page, /第 1 题/);
  await expect(page.locator('.explain').first()).toContainText('官方考生范文（考官评分 18/20');
  await expect(page.locator('.explain').first()).toContainText('考官点评：');
});

test('Ready frame 2.23: the handwritten notes are a row of chips under the email; the "Write your email…" line joins the title', async ({ page }) => {
  await page.goto('/#/p/pet1/pet1-t1-w');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /材料/);
  await expect(page.locator('.rt-note.is-email .rt-callout')).toHaveCount(0);
  await expect(page.locator('.rt-callouts .rt-callout')).toHaveText(['Good idea!', 'Explain which is better', 'Tell Mrs Hallam', /^Suggest/]);
  await tab(page, /题目/);
  await expect(page.locator('.q-prompt')).toContainText('the notes you have made. Write your email to Mrs Hallam using all the notes.');
});
