// Final pre-delivery QA (2026-11-12), reader / UI behaviour: modal dialogs for keyboard users, 定位原文 brings the
// sentence itself into view, a shared sentence shows once, the Part strip fade, an exam that ran out of time while its
// recording played, friendly load errors, vocab table-day entries and two-blank labels.
import { expect, test, type Page } from '@playwright/test';
import { goQuestion } from './nav';

const narrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;
const tab = async (page: Page, name: RegExp) => {
  if (narrow(page) && (await page.locator('.reader-body.no-left').count()) === 0) await page.getByRole('tab', { name }).click();
};
const focusInDialog = (page: Page) => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));

test('the exam mode dialog is modal: focus starts in it, Tab stays in it, nothing behind it can be started', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-l');
  await expect(page.locator('.mode-dialog')).toBeVisible();
  expect(await focusInDialog(page)).toBe(true);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await focusInDialog(page)).toBe(true);
  }
  // the page behind is inert (no focus, no clicks, hidden from screen readers)
  expect(await page.evaluate(() => !!document.querySelector('.reader-head')?.closest('[inert]'))).toBe(true);
  expect(await page.evaluate(() => [...document.querySelectorAll('audio')].some((a) => !a.paused))).toBe(false);
  // Esc closes it (back to the playlist, as the close button does)
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#\/p\/ket1$/);
});

test('submit confirm: focus trapped inside, Esc closes it and gives the focus back to 提交', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  await tab(page, /题目/);
  await page.locator('.question-nav .question-dot').last().click();
  const submit = page.getByRole('button', { name: /^提交/ }).last();
  await submit.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.submit-confirm')).toBeVisible();
  expect(await focusInDialog(page)).toBe(true);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(await focusInDialog(page)).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('.submit-confirm')).toHaveCount(0);
  await expect(submit).toBeFocused();
});

test('blanks that share one sentence show it once, with all their inputs (ci-g8-w03-thu q5, ci-g8-w09-thu q2)', async ({ page }) => {
  for (const [id, n, inputs] of [['ci-g8-w03-thu', 5, 3], ['ci-g8-w09-thu', 2, 2]] as const) {
    await page.goto(`/#/p/ci-g8/${id}`);
    await page.locator('.question-nav .question-dot').first().waitFor({ state: 'attached' });
    await tab(page, /题目/);
    await goQuestion(page, new RegExp(`第 ${n} 题`));
    await expect(page.locator('.reader-right .context-line')).toHaveCount(1);
    await expect(page.locator('.reader-right .context-line input')).toHaveCount(inputs);
  }
});

test('定位原文 in a long listening transcript puts the sentence itself on screen (pet2-t2-l Q19)', async ({ page }) => {
  await page.goto('/#/p/pet2/pet2-t2-l');
  await page.getByRole('button', { name: /练习模式/ }).click();
  await tab(page, /题目/);
  await page.locator('.part-nav .part-card').last().click();
  await page.locator('.part-nav .part-q').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.getByRole('button', { name: '查看答案与解析' }).click();
  await goQuestion(page, /第 19 题/);
  await page.locator('.reader-right').getByRole('button', { name: '定位原文' }).first().click();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const hl = (CSS as unknown as { highlights: Map<string, Iterable<Range>> }).highlights.get('evidence');
          const r = hl ? [...hl][0]?.getBoundingClientRect() : null;
          const pane = document.querySelector('.reader-left .article-scroll, .reader-left')!.getBoundingClientRect();
          return !!r && r.top >= pane.top - 1 && r.bottom <= Math.min(pane.bottom, innerHeight) + 1;
        }),
      { timeout: 5000 },
    )
    .toBe(true);
});

test('a Part of five numbers shows them all without the "more" fade (zkv-d01 Part 1)', async ({ page }) => {
  await page.goto('/#/p/zkv/zkv-d01');
  await page.getByRole('tab', { name: /测验/ }).click();
  const qs = page.locator('.part-card.is-current .part-qs');
  await expect(qs.locator('.part-q')).toHaveCount(5);
  await expect(qs).not.toHaveClass(/has-more-end/);
});

test('exam listening: time runs out while the recording plays, then a reload — the recording continues and the paper is handed in when it ends', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-l');
  await page.getByRole('button', { name: /考试模式/ }).click();
  await tab(page, /材料/);
  await page.getByRole('button', { name: '开始播放听力' }).click();
  await expect.poll(() => page.evaluate(() => document.querySelector('audio')?.currentTime ?? 0), { timeout: 20000 }).toBeGreaterThan(4);
  await page.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.endsWith('ket1-t1-l'))!;
    const a = JSON.parse(localStorage.getItem(k)!);
    a.startedAt = new Date(Date.now() - 40 * 60000).toISOString();
    localStorage.setItem(k, JSON.stringify(a));
  });
  await page.reload();
  await expect(page.locator('.mode-dialog')).toHaveCount(0); // not discarded as 考试超时
  await expect(page.locator('.mode-select')).toContainText('录音结束后自动交卷');
  await tab(page, /材料/);
  await page.getByRole('button', { name: /继续播放/ }).click();
  await expect(async () => {
    await page.evaluate(() => {
      const a = document.querySelector('audio');
      if (a?.duration) a.currentTime = a.duration - 0.2;
    });
    await expect(page.locator('.report-dialog')).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 30000 });
});

test('a missing item or playlist says so in words and offers a way back', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w99-mon');
  await expect(page.locator('.load-error')).toContainText('找不到这项内容');
  await expect(page.locator('.load-error')).not.toContainText('Unexpected token');
  await page.locator('.load-error').getByRole('button', { name: '返回合集' }).click();
  await expect(page).toHaveURL(/#\/p\/ci-g3$/);
  await page.goto('/#/p/nope');
  await expect(page.locator('.load-error')).toContainText('找不到该合集');
  await page.locator('.load-error').getByRole('button', { name: '返回首页' }).click();
  await expect(page.locator('.page-title')).toBeVisible();
});

test('vocab: both blanks of a two-blank prompt are announced with their number (12-1, 12-2)', async ({ page }) => {
  await page.goto('/#/p/gkv/gkv-d115');
  await page.getByRole('tab', { name: /测验/ }).click();
  const row = page.locator('.vq-sentence', { hasText: '牙齿' });
  const labels = await row.getByRole('textbox').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''));
  expect(labels).toHaveLength(2);
  expect(labels[0]).toMatch(/\d+-1/);
  expect(labels[1]).toMatch(/\d+-2/);
});

test('vocab table day: each wrong table answer links to its entry (docs/16 §3.3)', async ({ page }) => {
  await page.goto('/#/p/zkv/zkv-d69');
  await page.getByRole('tab', { name: /测验/ }).click();
  await page.getByRole('button', { name: /^Part 4/ }).click();
  await page.getByRole('button', { name: '提交' }).click();
  const confirm = page.getByRole('dialog').getByRole('button', { name: /提交/ });
  if (await confirm.count()) await confirm.click();
  await page.getByRole('button', { name: /查看答案/ }).click();
  await page.getByRole('button', { name: /^Part 4/ }).click(); // 16 verb forms; 15 of them have an entry
  const links = page.locator('.vq-table + .vq-review .vq-word-list .vq-word');
  expect(await links.count()).toBeGreaterThan(0);
  await links.first().click();
  await expect(page.locator('.entry-dialog')).toBeVisible();
});

test('#149 home filter row: 全部 / 最近在读 / 已完成 with counts; a started playlist moves into 最近在读, newest first', async ({ page }) => {
  const attempt = (itemId: string, at: string, submitted: boolean) => ({
    attemptId: itemId, itemId, itemVersion: '1', learnerId: null, startedAt: at, submittedAt: submitted ? at : null, durationSec: 0,
    status: submitted ? 'submitted' : 'in_progress', responses: {}, result: submitted ? { score: 1, maxScore: 1, byQuestion: [] } : null,
  });
  await page.addInitScript((rows) => {
    for (const r of rows) localStorage.setItem(`uniread.rc.attempt.${r.itemId}`, JSON.stringify(r));
  }, [attempt('ci-g3-w01-mon', '2026-11-10T08:00:00Z', true), attempt('ket1-t1-rw', '2026-11-11T08:00:00Z', false)]);
  await page.goto('/');
  const all = page.getByRole('radio', { name: /全部/ });
  await expect(all).toHaveAttribute('aria-checked', 'true');
  await expect(all).toContainText('15');
  await expect(page.locator('.playlist-card')).toHaveCount(15);
  await page.getByRole('radio', { name: /最近在读/ }).click();
  await expect(page.locator('.playlist-card')).toHaveCount(2);
  await expect(page.locator('.playlist-card-title').first()).toContainText('KET'); // latest activity first
  await page.getByRole('radio', { name: /已完成/ }).click();
  await expect(page.locator('.playlist-card')).toHaveCount(0);
  await expect(page.locator('.playlist-empty')).toBeVisible();
});

test('a number tapped while the answers are being graded is kept: the review does not jump back to question 1 (dev regression 2026-11-12)', async ({ page }) => {
  await page.route('**/api/rc/grade', async (route) => {
    await new Promise((r) => setTimeout(r, 1500)); // a slow network
    await route.continue();
  });
  await page.goto('/#/p/ci-g5/ci-g5-w12-thu');
  if ((page.viewportSize()?.width ?? 1440) < 1024) await page.getByRole('tab', { name: /题目/ }).click();
  await page.getByRole('radio', { name: /Growth Mindset/ }).click();
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.getByRole('button', { name: /^第 2 题/ }).click(); // while the grading is still on its way
  await expect(page.locator('.option.is-correct, .option.is-wrong').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.q-prompt').first()).toContainText('Tell me I’m clever');
});

test('tapping the number of the page already shown while it is being graded keeps that page too', async ({ page }) => {
  await page.route('**/api/rc/grade', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.goto('/#/p/ci-g5/ci-g5-w12-thu');
  if ((page.viewportSize()?.width ?? 1440) < 1024) await page.getByRole('tab', { name: /题目/ }).click();
  await page.locator('.question-dot').last().click();
  const prompt = (await page.locator('.q-prompt').first().textContent()) ?? '';
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.locator('.question-dot').last().click(); // the page already shown, while the grading is on its way
  await expect(page.locator('.option.is-correct, .option.is-wrong').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.q-prompt').first()).toHaveText(prompt);
});
