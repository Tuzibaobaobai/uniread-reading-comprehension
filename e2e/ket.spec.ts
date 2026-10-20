// KET 真题 (exam papers): mode choice, tap-only answering, exam-mode audio, transcript after submitting, report.
import { expect, test, type Page } from '@playwright/test';

const narrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;
const tab = async (page: Page, name: RegExp) => {
  if (narrow(page)) await page.getByRole('tab', { name }).click();
};

test('playlist groups the papers by test', async ({ page }) => {
  await page.goto('/#/p/ket1');
  await expect(page.locator('.week-label').first()).toContainText('第 1 套');
  await expect(page.locator('.item-row-title').first()).toHaveText('KET真题1-第1套-阅读与写作');
  await expect(page.locator('.test-score').first()).toHaveText('KET 成绩：已完成 0/4');
});

test('listening, exam mode: picture options by tap, locked recording, report and transcript after submitting', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-l');
  await page.getByRole('button', { name: /考试模式/ }).click();
  await expect(page.locator('.exam-timer')).toContainText('剩余');
  // recordings: one start button for the whole exam, no pause / skip / seek controls
  await tab(page, /材料/);
  await expect(page.locator('.part-audio')).toHaveCount(5);
  await expect(page.getByRole('button', { name: '开始播放听力' })).toHaveCount(1);
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

test('#65 closing the mode dialog: a new paper goes back to the playlist, 重新作答 back to the result', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-s');
  await page.getByRole('button', { name: '关闭，返回合集' }).click();
  await expect(page).toHaveURL(/#\/p\/ket1$/);
  await page.goto('/#/p/ket1/ket1-t1-l');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.locator('.option').first().click();
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.getByRole('button', { name: '查看答案与解析' }).click();
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '重新作答' }).click();
  await page.getByRole('button', { name: '关闭，返回作答结果' }).click();
  await expect(page.locator('.question-dot.is-wrong, .question-dot.is-correct').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '成绩报告' })).toBeVisible();
});

test('#66 switch from practice to exam mode and back', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-rw');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.locator('.option').first().click();
  await page.getByRole('button', { name: '切换到考试模式' }).click();
  await expect(page.getByRole('dialog')).toContainText('当前已作答的 1 题会被清空');
  await page.getByRole('button', { name: '开始考试' }).click();
  await expect(page.locator('.exam-timer')).toBeVisible();
  await expect(page.locator('.option.is-selected')).toHaveCount(0);
  await page.locator('.option').nth(1).click();
  await page.getByRole('button', { name: '切换到练习模式' }).click();
  await page.getByRole('button', { name: '切换到练习', exact: true }).click();
  await expect(page.locator('.exam-timer')).toHaveCount(0);
  await expect(page.locator('.option.is-selected')).toHaveCount(1); // answers kept
});

test('#67 the report links to the conversion table', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t2-l');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.getByRole('button', { name: '换算表' }).click();
  await expect(page.getByRole('dialog', { name: 'Cambridge English Scale 换算表' })).toContainText('17');
  await page.getByRole('button', { name: '关闭，返回成绩报告' }).click();
  await expect(page.getByRole('dialog', { name: '成绩报告' })).toBeVisible();
});

test('#69 #70 playlist labels: 考试中, 考试超时 → practice keeps the answers, then raw + scaled score', async ({ page }) => {
  await page.clock.install();
  await page.goto('/#/p/ket1/ket1-t3-l');
  await page.getByRole('button', { name: /考试模式/ }).click();
  await tab(page, /题目/);
  await page.locator('.option').first().click();
  await page.goto('/#/p/ket1');
  await expect(page.locator('.item-row', { hasText: '第3套-听力' })).toContainText('考试中');
  await page.clock.fastForward('36:00');
  await page.reload();
  await expect(page.locator('.item-row', { hasText: '第3套-听力' })).toContainText('考试超时');
  await page.locator('.item-row', { hasText: '第3套-听力' }).click();
  await expect(page.getByRole('dialog')).toContainText('上次考试时间已到');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await expect(page.locator('.option.is-selected')).toHaveCount(1);
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await expect(page.getByRole('dialog', { name: '成绩报告' })).toBeVisible();
  await page.goto('/#/p/ket1');
  await expect(page.locator('.item-row', { hasText: '第3套-听力' })).toContainText(/原始分 \d+\/25 · 换算分/);
});

test('#72 listening: every Part stacked; the exam recording keeps playing while moving between Parts', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t4-l');
  await page.getByRole('button', { name: /考试模式/ }).click();
  await tab(page, /材料/);
  await page.getByRole('button', { name: '开始播放听力' }).click();
  await expect(page.locator('.part-audio.is-playing .part-audio-title')).toContainText('Part 1');
  await tab(page, /题目/);
  await page.getByRole('button', { name: /Part 2 第 6 题/ }).click();
  await tab(page, /材料/);
  await expect(page.locator('.part-audio.is-current .part-audio-title')).toContainText('Part 2');
  await expect(page.locator('.part-audio.is-playing .part-audio-title')).toContainText('Part 1'); // audio did not follow
  await expect(page.locator('.question-dot.part-start')).toHaveCount(5);
});

test('#72 listening practice: each Part has its own controls, one plays at a time', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t4-l');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /材料/);
  const play = page.getByRole('button', { name: '播放', exact: true });
  await expect(play).toHaveCount(5);
  await play.first().click();
  await expect(page.locator('.part-audio.is-playing')).toHaveCount(1);
  await page.locator('.part-audio').nth(1).getByRole('button', { name: '播放', exact: true }).click();
  await expect(page.locator('.part-audio.is-playing .part-audio-title')).toContainText('Part 2');
  await expect(page.getByRole('button', { name: '暂停' })).toHaveCount(1);
});
