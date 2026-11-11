// final test 2026-11-12: what the playlist rows and the test badge say about a saved result
import { expect, test, type Page } from '@playwright/test';

type Row = { q: string; correct: boolean | null; points: number; maxPoints: number; scoredBy?: string };
async function save(page: Page, itemId: string, byQuestion: Row[], extra: Record<string, unknown> = {}) {
  await page.evaluate(
    ([id, rows, more]) => {
      const score = rows.reduce((n, r) => n + r.points, 0);
      const maxScore = rows.reduce((n, r) => n + r.maxPoints, 0);
      localStorage.setItem(
        `uniread.rc.attempt.${id}`,
        JSON.stringify({
          attemptId: id, itemId: id, itemVersion: '1.0.0', learnerId: null, startedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(), durationSec: 60, status: 'submitted', mode: 'practice', responses: {},
          result: { score, maxScore, byQuestion: rows }, ...more,
        }),
      );
    },
    [itemId, byQuestion, extra] as const,
  );
}
const rows = (n: number, right: number, prefix = 'q') =>
  Array.from({ length: n }, (_, i) => ({ q: `${prefix}${i + 1}`, correct: i < right, points: i < right ? 1 : 0, maxPoints: 1 }));

test('时文 rows keep half points, show the full mark and say when answers wait for the AI', async ({ page }) => {
  await page.goto('/#/');
  await save(page, 'ci-g3-w01-mon', [
    { q: 'q1', correct: true, points: 2, maxPoints: 2 },
    { q: 'q2', correct: false, points: 0.5, maxPoints: 1 },
    { q: 'q3', correct: null, points: 0, maxPoints: 3, scoredBy: 'self' },
  ]);
  await save(page, 'ci-g3-w01-tue', [
    { q: 'q1', correct: true, points: 2, maxPoints: 2 },
    { q: 'q2', correct: false, points: 0.5, maxPoints: 1 },
  ]);
  // typed into and cleared again: not started
  await page.evaluate(() =>
    localStorage.setItem(
      'uniread.rc.attempt.ci-g3-w01-wed',
      JSON.stringify({
        attemptId: 'w', itemId: 'ci-g3-w01-wed', itemVersion: '1.0.0', learnerId: null, startedAt: new Date().toISOString(),
        submittedAt: null, durationSec: 0, status: 'in_progress', responses: { q1: { b1: '' }, q2: [] }, result: null,
      }),
    ),
  );
  await page.goto('/#/p/ci-g3');
  await expect(page.getByText('得分 2.5/6 · 待 AI 批改')).toBeVisible();
  await expect(page.getByText(/得分 2\.5\/3(?! ·)/)).toBeVisible();
  const wed = page.locator('a[href$="/ci-g3-w01-wed"]');
  await expect(wed).toHaveCount(1);
  await expect(wed).not.toContainText('进行中');
});

test('PET below the reported range is <102 (B1 floor), KET <82; four papers marked with one below range say so', async ({ page }) => {
  await page.goto('/#/');
  await save(page, 'pet1-t1-r', rows(32, 0));
  await page.goto('/#/p/pet1');
  await expect(page.getByText('原始分 0/32 · 换算分 <102')).toBeVisible();
  await page.goto('/#/');
  await save(page, 'ket1-t1-l', rows(25, 0));
  await save(page, 'ket1-t1-rw', [...rows(30, 25), ...['q31', 'q32'].map((q) => ({ q, correct: false, points: 12, maxPoints: 15, scoredBy: 'judge' }))]);
  await save(page, 'ket1-t1-s', ['q1', 'q2'].map((q) => ({ q, correct: false, points: 12, maxPoints: 15, scoredBy: 'judge' })));
  await page.goto('/#/p/ket1');
  await expect(page.getByText('原始分 0/25 · 换算分 <82')).toBeVisible();
  await expect(page.locator('.test-score').first()).toHaveText('成绩：听力低于 82，无法估算总分');
});

test('KET writing left for the AI: the row keeps the reading mark and shows no raw 0 for writing', async ({ page }) => {
  await page.goto('/#/');
  await save(page, 'ket1-t1-rw', [...rows(30, 20), ...['q31', 'q32'].map((q) => ({ q, correct: null, points: 0, maxPoints: 15, scoredBy: 'self' }))]);
  await page.goto('/#/p/ket1');
  await expect(page.getByText('阅读原始分 20/30 · 写作待 AI 批改')).toBeVisible();
});

test('speaking report: each Part shows the examiner questions answered, not Part marks on another scale than 45', async ({ page }) => {
  await page.goto('/#/p/ket1/ket1-t1-s');
  await page.getByRole('button', { name: /练习模式/ }).click();
  for (let i = 0; i < 30 && !(await page.getByRole('button', { name: '提交' }).count()); i++) await page.getByRole('button', { name: '下一题' }).click();
  await page.getByRole('button', { name: '提交' }).first().click();
  const confirm = page.getByRole('dialog').getByRole('button', { name: /提交/ });
  if (await confirm.count()) await confirm.first().click();
  const report = page.locator('.report-dialog');
  await expect(report).toContainText(/Part 1\s*已答 0\/8 题/);
  await expect(report).toContainText(/Part 2\s*已答 0\/13 题/);
  await expect(report).toContainText('原始分 0 / 45');
});
