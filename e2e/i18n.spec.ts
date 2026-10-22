// i18next UI chrome (GitHub #106): the standalone preview starts in the language saved under localStorage `rc.locale`.
import { expect, test, type Page } from '@playwright/test';

const narrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;

test.beforeEach(async ({ page }) => {
  // en-US unless a test already chose a language (so switching back survives reloads)
  await page.addInitScript(() => {
    if (localStorage.getItem('rc.locale') === null) localStorage.setItem('rc.locale', 'en-US');
  });
});

test('en-US: playlists and playlist pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('.page-title')).toHaveText('Topical Reading');
  await expect(page.locator('.playlist-card-meta').first()).toHaveText(/^\d+ articles · L\d/);
  await expect(page.locator('.playlist-card-meta', { hasText: /papers ·/ }).first()).toBeVisible();

  await page.goto('/#/p/ci-g3');
  await expect(page.locator('.playlist-items-head')).toHaveText(/^Items \(\d+\)$/);
  await expect(page.locator('.week-label').first()).toHaveText('Week 1');
  await expect(page.locator('.item-row-meta').first()).toContainText(/\d+ questions · \d+ min/);
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();

  await page.goto('/#/p/ket1');
  await expect(page.locator('.week-label').first()).toContainText('Test 1');
  await expect(page.locator('.test-score').first()).toHaveText('Result: complete all papers');
});

test('en-US: exam paper mode dialog and header mode select', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-l');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Listening · Official time');
  await expect(dialog.getByRole('button', { name: /^Practice mode/ })).toContainText('No time limit; pause, replay and seek the recordings');
  await expect(page.getByRole('button', { name: 'Close and return to the playlist' })).toBeVisible();
  await dialog.getByRole('button', { name: /^Exam mode/ }).click();

  const select = page.locator('.mode-select-button');
  await expect(select).toHaveAccessibleName('Current: Exam mode. Switch mode');
  await expect(select).toContainText('Exam mode');
  await expect(page.locator('.exam-timer')).toHaveText(/^\d+ min left$/);
  // the longer English label still fits the header
  const fits = await select.evaluate((el) => {
    const head = el.closest('.reader-head')!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return r.right <= head.right + 0.5 && el.scrollWidth <= el.clientWidth + 1;
  });
  expect(fits).toBe(true);
  await select.click();
  await expect(page.getByRole('menu', { name: 'Answer mode' })).toBeVisible();
  await page.getByRole('menuitemradio', { name: 'Practice mode' }).click();
  await expect(page.getByRole('dialog')).toContainText('End the exam and switch to practice mode?');
  await page.getByRole('button', { name: 'Cancel' }).click();
  if (narrow(page)) await page.getByRole('tab', { name: /^Questions/ }).click();
  await expect(page.getByRole('button', { name: 'Flag question' })).toBeVisible();
});

test('en-US: 时文阅读 question navigation, then back to zh-CN', async ({ page }) => {
  await page.goto('/#/p/ci-g3/ci-g3-w01-mon');
  await expect(page.locator('.info-box')).toContainText('Suggested time');
  if (narrow(page)) await page.getByRole('tab', { name: /^Questions 0\/3$/ }).click();
  const nav = page.getByRole('navigation', { name: 'Question navigation' });
  await expect(nav.getByRole('button', { name: 'Previous' })).toBeDisabled();
  await expect(nav.getByRole('button', { name: 'Question 1', exact: true })).toBeVisible();
  await nav.getByRole('button', { name: 'Next' }).click();
  await nav.getByRole('button', { name: 'Next' }).click();
  await nav.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('dialog')).toContainText('3 questions not answered');
  await page.getByRole('button', { name: 'Keep answering' }).click();

  await page.evaluate(() => localStorage.setItem('rc.locale', 'zh-CN'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  if (narrow(page)) await page.getByRole('tab', { name: /题目/ }).click();
  const zhNav = page.getByRole('navigation', { name: '题目导航' });
  await expect(zhNav.getByRole('button', { name: '上一题' })).toBeVisible();
  await expect(zhNav.getByRole('button', { name: '第 1 题', exact: true })).toBeVisible();
  await page.goto('/');
  await expect(page.locator('.page-title')).toHaveText('时文阅读');
});
