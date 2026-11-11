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

test('回答问题: LLM judge verdict is shown and counted (mocked judge)', async ({ page }, info) => {
  let calls = 0;
  await page.route('**/api/rc/judge', async (route) => {
    calls++;
    const body = route.request().postDataJSON() as { questionId: string; response: string };
    expect(body).not.toHaveProperty('sampleAnswer'); // the client never sends or receives the rubric
    await route.fulfill({
      json: {
        score: 1.5, maxPoints: 2,
        keyPoints: [{ id: 'k1', met: 'yes' }, { id: 'k2', met: 'partial' }],
        languageIssues: [{ text: 'they has', fix: 'they have', noteZh: '主谓一致' }],
        feedbackZh: '答出了热量高这一点，再补充“对健康有害”就完整了。',
        confidence: 0.62, flags: [], needsReview: false,
        model: 'mock', promptVersion: 'rc-judge-v3', judgedAt: new Date().toISOString(),
      },
    });
  });
  await openQuestion(page, 1);
  await page.locator('.long-answer').fill('Because they has a lot of calories.');
  await page.getByRole('button', { name: /^第 17 题/ }).click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await expect(page.locator('.judge-score')).toContainText('1.5');
  await expect(page.locator('.judge')).not.toContainText('待老师确认'); // no teacher review step (2026-11-12)
  await expect(page.locator('.judge-point')).toHaveCount(2);
  await expect(page.locator('.self-assess')).toHaveCount(0);
  expect(calls).toBe(1); // the one answered 回答问题 is judged once; the 5 unanswered are 0 without a model call
  await page.screenshot({ path: `.work/screens/${info.project.name}/5-g7-judge.png` });
});

test('回答问题: no judge service → falls back to self-assessment', async ({ page }) => {
  await page.route('**/api/rc/judge', (route) => route.fulfill({ status: 404, body: 'not found' }));
  await openQuestion(page, 1);
  await page.locator('.long-answer').fill('They are high in calories.');
  await page.getByRole('button', { name: /^第 17 题/ }).click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await expect(page.locator('.self-assess')).toBeVisible();
  // and says so (QA 2026-11-11 F6): not marked yet, re-marked when the page is opened again — no score
  await expect(page.locator('.judge.is-pending')).toHaveText('AI 批改暂时不可用，可以先对照参考答案自查；再次打开本页时会自动批改。');
  await expect(page.locator('.judge-score')).toHaveCount(0);
});


test('一对多连线：每句一题、分页、单独反馈，定位原文精确到对应的那一行 (#13)', async ({ page }, info) => {
  await page.goto('/#/p/ci-g5/ci-g5-w12-thu');
  if (narrow(page)) await page.getByRole('tab', { name: /题目/ }).click();
  await expect(page.locator('.question-dot')).toHaveCount(7);
  await expect(page.locator('.q-prompt')).toContainText('I love to be challenged.');
  await expect(page.getByRole('radio')).toHaveText(['A. Fixed Mindset', 'B. Growth Mindset']);
  await page.getByRole('radio', { name: /Growth Mindset/ }).click(); // q1 right
  await page.getByRole('button', { name: '下一题' }).click();
  await page.getByRole('radio', { name: /Growth Mindset/ }).click(); // q2 wrong
  await page.locator('.question-dot').last().click();
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('button', { name: '仍然提交' }).click();
  await page.getByRole('button', { name: /^第 2 题/ }).click();
  await expect(page.locator('.option.is-wrong')).toContainText('Growth Mindset');
  await expect(page.locator('.option.is-correct .option-explain-text')).toContainText('Tell me I’m smart');
  await page.getByRole('button', { name: '定位原文' }).click();
  const hl = await page.evaluate(() => {
    const h = (CSS as unknown as { highlights: Map<string, Set<Range>> }).highlights.get('evidence');
    return h ? [...h].map((r) => r.toString()) : [];
  });
  expect(hl).toEqual(['Tell me I’m smart.']); // one line, not the whole Fixed Mindset paragraph
  await page.screenshot({ path: `.work/screens/${info.project.name}/5-g5-per-statement.png` });
});

test('verdicts that arrive after the learner left are kept: no second round of judging on the next visit (QA 2026-11-12)', async ({ page, request }) => {
  const itemId = 'ci-g7-w01-fri';
  const item = (await (await request.get(`/playlists/ci-g7/items/${itemId}.json`)).json()) as { status: { version: string }; sections: { questions: { id: string; interaction: { kind: string } }[] }[] };
  const judged = item.sections.flatMap((s) => s.questions).filter((q) => q.interaction.kind === 'extendedText').map((q) => q.id);
  const responses = Object.fromEntries(judged.map((q) => [q, 'They lose water and absorb fat.']));
  const { result } = await (await request.post('/api/rc/grade', { data: { itemId, responses } })).json();
  const attempt = { attemptId: 'a-left', itemId, itemVersion: item.status.version, learnerId: null, startedAt: '2026-11-12T00:00:00Z', submittedAt: '2026-11-12T00:01:00Z', durationSec: 60, status: 'submitted', responses, result };
  await page.addInitScript((a) => {
    if (!sessionStorage.getItem('seeded')) localStorage.setItem(`uniread.rc.attempt.${a.itemId}`, JSON.stringify(a));
    sessionStorage.setItem('seeded', '1');
  }, attempt);
  let calls = 0;
  await page.route('**/api/rc/judge', async (route) => {
    calls++;
    await new Promise((ok) => setTimeout(ok, 1500));
    await route.fulfill({ json: { score: 1, maxPoints: 2, keyPoints: [{ id: 'k1', met: 'yes' }], languageIssues: [], feedbackZh: '答到了一个要点。', confidence: 0.9, flags: [], needsReview: false, model: 'mock', promptVersion: 'rc-judge-v4', judgedAt: new Date().toISOString() } });
  });
  await page.goto(`/#/p/ci-g7/${itemId}`);
  await expect.poll(() => calls).toBeGreaterThan(0);
  await page.goto('/#/p/ci-g7'); // leave while it is still marking
  await expect
    .poll(async () => page.evaluate((id) => JSON.parse(localStorage.getItem(`uniread.rc.attempt.${id}`) ?? 'null')?.result.byQuestion.filter((b: { scoredBy?: string }) => b.scoredBy === 'judge').length, itemId), { timeout: 10_000 })
    .toBe(judged.length);
  const before = calls;
  await page.goto(`/#/p/ci-g7/${itemId}`);
  await page.waitForTimeout(1000);
  expect(calls).toBe(before);
});
