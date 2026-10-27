// KET 真题 (exam papers): mode choice, tap-only answering, exam-mode audio, transcript after submitting, report.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const narrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;
const tab = async (page: Page, name: RegExp) => {
  // pages without left-pane material show no tabs (#78)
  if (narrow(page) && (await page.locator('.reader-body.no-left').count()) === 0) await page.getByRole('tab', { name }).click();
};
/** #102: the mode switch is a menu in the header's top right */
const switchMode = async (page: Page, to: '练习模式' | '考试模式') => {
  await page.locator('.mode-select-button').click();
  await page.getByRole('menuitemradio', { name: to }).click();
};

test('playlist groups the papers by test', async ({ page }) => {
  await page.goto('/#/p/ket1');
  await expect(page.locator('.week-label').first()).toContainText('第 1 套');
  await expect(page.locator('.item-row-title').first()).toHaveText('KET真题1-第1套-阅读与写作');
  await expect(page.locator('.test-score').first()).toHaveText('成绩：待完成所有考试');
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
  await switchMode(page, '考试模式');
  await expect(page.getByRole('dialog')).toContainText('当前已作答的 1 题会被清空');
  await page.getByRole('button', { name: '开始考试' }).click();
  await expect(page.locator('.reader-head .mode-select-button')).toContainText('考试模式');
  await expect(page.locator('.reader-head .exam-timer')).toBeVisible();
  await expect(page.locator('.option.is-selected')).toHaveCount(0);
  await page.locator('.option').nth(1).click();
  await switchMode(page, '练习模式');
  await page.getByRole('button', { name: '切换到练习', exact: true }).click();
  await expect(page.locator('.exam-timer')).toHaveCount(0);
  await expect(page.locator('.mode-select-button')).toHaveText('练习模式');
  await expect(page.locator('.question-card .exam-bar')).toHaveCount(0); // no mode bar in the card any more
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

test('#74 speaking: one examiner question per page, numbered on across Parts', async ({ page }) => {
  const item = JSON.parse(readFileSync('content/playlists/ket1/items/ket1-t1-s.json', 'utf8')) as {
    sections: { questions: { interaction: { turns: { text: string }[] } }[] }[];
  };
  const turns = item.sections.flatMap((s) => s.questions.flatMap((q) => q.interaction.turns));
  await page.goto('/#/p/ket1/ket1-t1-s');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await expect(page.locator('.question-dot')).toHaveCount(turns.length);
  await expect(page.locator('.question-dot.part-start')).toHaveCount(2);
  await expect(page.locator('.speak-card')).toHaveCount(1);
  await expect(page.locator('.speak-line')).toHaveText(turns[0].text);
  await page.getByRole('button', { name: '下一题' }).click();
  await expect(page.locator('.speak-line')).toHaveText(turns[1].text);
  await expect(page.locator('.q-num')).toHaveText('2.');
});

test('speaking: 听题 plays the generated examiner recording', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-s');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  const audio = page.waitForRequest((r) => /ket1-t1-s-q1-t1\.mp3$/.test(r.url()));
  await page.getByRole('button', { name: '听题' }).click();
  await audio;
});

test('#77 #78 speaking: full-width Part 1, and a switch to exam mode starts with 回答, not 重录', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t2-s');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await expect(page.locator('.reader-body.no-left')).toHaveCount(1);
  await expect(page.locator('.reader-left')).toBeHidden();
  await expect(page.locator('.reader-right')).toBeVisible();
  await switchMode(page, '考试模式');
  await page.getByRole('button', { name: '开始考试' }).click();
  await expect(page.getByRole('button', { name: '回答' })).toBeVisible();
  await expect(page.getByRole('button', { name: '重录' })).toHaveCount(0);
  // Part 2 has the picture sheet: two columns again (narrow screens: tabs)
  await page.getByRole('button', { name: /Part 2 第/ }).first().click();
  await expect(page.locator('.reader-body.no-left')).toHaveCount(0);
});

test('#81 #83 #84 #85 exam prompts: number only, no repeated sentence, no Chinese hints, bold key words', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-rw');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await expect(page.locator('.q-prompt').first()).toHaveText('1.'); // #81
  await page.getByRole('button', { name: /第 19 题/ }).click();
  await expect(page.locator('.q-prompt')).toHaveText('19.'); // #83
  if (!narrow(page)) await expect(page.locator('.context-line')).toBeHidden();
  await page.getByRole('button', { name: /第 25 题/ }).click();
  await expect(page.locator('.hint-line')).toHaveCount(0); // #84
  await expect(page.locator('.section-instruction b', { hasText: 'ONE' })).toBeVisible();
  await page.goto('/#/p/ket1/ket1-t1-l');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.getByRole('button', { name: /第 6 题/ }).click();
  await expect(page.locator('.section-instruction b')).toHaveText(['Part 2. ', 'one word', 'number', 'date', 'time']); // #85 (the Part label is bold too)
});

test('#86 listening Part 3: all five questions on one page', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-l');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.getByRole('button', { name: /第 11–15 题/ }).click();
  await expect(page.locator('.part-stack-q')).toHaveCount(5);
  // options stacked vertically as printed; Part 4 (separate short recordings) stays one question per page
  const [a, b2] = await page.locator('.part-stack-q').first().locator('.option').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
  expect(b2).toBeGreaterThan(a);
  await expect(page.getByRole('button', { name: /第 16 题/ })).toHaveCount(1);
});

test('#91 #96 reading Part 2 portraits beside the texts; Part 6 email keeps its header band', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t3-rw');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.getByRole('button', { name: /第 7–13 题/ }).click();
  await tab(page, /材料/);
  await expect(page.locator('.rt-portrait')).toHaveCount(3);
  await tab(page, /题目/);
  await page.getByRole('button', { name: /第 31 题/ }).click();
  await tab(page, /材料/);
  await expect(page.locator('.rt-note.is-email .rt-note-field-label')).toHaveText(['From:', 'To:']);
});

test('#87 listening Part 5: two-column board, example option out, each option once', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-l');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.getByRole('button', { name: /第 21–25 题/ }).click();
  await expect(page.locator('.match-board-person.is-example')).toContainText('Jack');
  await expect(page.locator('.match-board-option')).toHaveCount(8);
  await expect(page.getByRole('button', { name: /^B .*例题已用/ })).toBeDisabled();
  await page.getByRole('button', { name: /^C / }).click(); // Edward (first person is active) → C
  await expect(page.locator('.match-board-person').nth(1).locator('.match-board-badge')).toHaveText('C');
  await page.locator('.match-board-person').nth(2).click(); // Beth
  await page.getByRole('button', { name: /^C / }).click(); // C moves to Beth
  await expect(page.locator('.match-board-person').nth(1).locator('.match-board-badge')).toHaveText('');
  await expect(page.locator('.match-board-person').nth(2).locator('.match-board-badge')).toHaveText('C');
});

test('#88 #89 speaking: exam mode hides the text; Part 2 is a discussion with the AI partner', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-s');
  await page.getByRole('button', { name: /考试模式/ }).click();
  await tab(page, /题目/);
  await expect(page.locator('.speak-line')).toHaveText('（考试模式：请听考官提问）');
  await page.getByRole('button', { name: /Part 2 第/ }).first().click();
  await page.getByRole('button', { name: '下一题' }).click();
  await expect(page.locator('.speak-role.is-partner')).toHaveText('搭档 Alex');
  await switchMode(page, '练习模式');
  await page.getByRole('button', { name: '切换到练习', exact: true }).click();
  await expect(page.locator('.speak-line')).not.toHaveText(/考试模式/);
});

test('KET 校园版真题 2 and 3: four tests each, all papers open; emails keep their header band', async ({ page }) => {
  for (const pl of ['ket2', 'ket3']) {
    await page.goto(`/#/p/${pl}`);
    await expect(page.locator('.item-row-title')).toHaveCount(12);
    await expect(page.locator('.item-row-title').nth(11)).toHaveText(`KET真题${pl.slice(-1)}-第4套-口语`);
  }
  await page.goto('/#/p/ket1/ket1-t1-rw');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.getByRole('button', { name: /第 25 题/ }).click();
  await tab(page, /材料/);
  await expect(page.locator('.rt-note.is-email .rt-note-field-label').first()).toHaveText('From:');
});

test('#109 listening papers last the official 30 minutes', async ({ page }) => {
  await page.goto('/#/p/ket1');
  await expect(page.locator('.item-row').nth(1)).toContainText('30 min');
  await page.goto('/#/p/pet1/pet1-t1-l');
  await expect(page.getByRole('dialog')).toContainText('30 分钟');
});

test('#82 every KET Reading Part 2 is one grid; the selected radio uses the accent colour', async ({ page }) => {
  await page.goto('/#/p/ket3/ket3-t2-rw');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.getByRole('button', { name: /第 7–13 题/ }).click();
  await expect(page.locator('.part-grid tbody tr')).toHaveCount(7);
  await page.locator('.part-grid-cell').first().click();
  const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  const dot = await page.locator('.part-grid-cell.is-selected .option-radio').evaluate((e) => getComputedStyle(e).color);
  const probe = await page.evaluate((c) => { const d = document.createElement('i'); d.style.color = c; document.body.append(d); const v = getComputedStyle(d).color; d.remove(); return v; }, accent);
  expect(dot).toBe(probe);
});

test('#128 after submitting, a Part on one page shows right / total in the pager; single questions keep ✓ / ✗', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-l');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.getByRole('button', { name: /第 11–15 题/ }).click();
  await page.locator('.part-stack-q').first().locator('.option').first().click();
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  const confirm = page.getByRole('button', { name: '仍然提交' });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await expect(page.getByRole('button', { name: /第 11–15 题/ }).locator('.is-score')).toHaveText(/^[0-5]\/5$/);
  await expect(page.getByRole('button', { name: /第 16 题/ }).locator('.question-dot-icon')).toHaveCount(1);
});
