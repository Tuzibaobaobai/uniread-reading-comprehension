// 词汇天天练 (#110, docs/16): Vocabulary | Quiz tabs, cover-meanings self-check, one Part per page, Enter to the next
// field, typed answers only (#115 #116), submit → result → review → entry, 只练错题.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const ITEM = 'zkv-d01';
const key = JSON.parse(readFileSync(`content/playlists/zkv/keys/${ITEM}.json`, 'utf8')) as {
  answers: Record<string, Record<string, unknown>>;
};
const item = JSON.parse(readFileSync(`content/playlists/zkv/items/${ITEM}.json`, 'utf8')) as {
  sections: { questions: { id: string; interaction: { kind: string; slots?: { id: string }[] } }[] }[];
};

/** every answer right, from the key — the questions in `skip` left empty */
function rightAnswers(skip: string[]) {
  const responses: Record<string, unknown> = {};
  for (const q of item.sections.flatMap((s) => s.questions)) {
    if (skip.includes(q.id)) continue;
    const k = key.answers[q.id] as Record<string, never>;
    if ('word' in k) responses[q.id] = { word: k.word[0], pos: k.pos[0], zh: k.zh[0] };
    else if ('forms' in k) {
      const r: Record<string, string> = {};
      Object.entries(k.forms as Record<string, { word: string[]; zh: string[] }>).forEach(([f, v]) => {
        r[`${f}.word`] = v.word[0];
        r[`${f}.zh`] = v.zh[0];
      });
      responses[q.id] = r;
    } else if ('slots' in k) {
      // a printed first letter is not typed again
      const first = (b: string) => new RegExp(`"id":"${b}"[^}]*"firstLetter":"(\\w)"`).exec(JSON.stringify(q))?.[1] ?? '';
      responses[q.id] = Object.fromEntries(
        Object.entries(k.slots as Record<string, { accept: string[] }>).map(([b, s]) => [b, s.accept[0].slice(first(b).length)]),
      );
    } else responses[q.id] = k.sampleAnswer;
  }
  return responses;
}

async function seed(page: Page, responses: Record<string, unknown>) {
  await page.goto('/#/');
  await page.evaluate(
    ([id, r]) =>
      localStorage.setItem(
        `uniread.rc.attempt.${id}`,
        JSON.stringify({
          attemptId: 'seed', itemId: id, itemVersion: '1.0.0', learnerId: null, startedAt: new Date().toISOString(),
          submittedAt: null, durationSec: 0, status: 'in_progress', responses: r, result: null,
        }),
      ),
    [ITEM, responses] as const,
  );
}

const mockJudge = (page: Page) =>
  page.route('**/api/rc/judge', async (route) => {
    const body = route.request().postDataJSON() as { questionId: string };
    await route.fulfill({
      json: {
        score: 4, maxPoints: 4, keyPoints: [{ id: 'meaning', met: 'yes' }, { id: 'language', met: 'yes' }],
        languageIssues: [], feedbackZh: `${body.questionId} 翻译准确。`, confidence: 0.9, flags: [], needsReview: false,
        model: 'mock', promptVersion: 'rc-judge-v3', judgedAt: new Date().toISOString(),
      },
    });
  });

test('playlist lists the days', async ({ page }) => {
  await page.goto('/#/p/zkv');
  await expect(page.locator('.item-row')).toHaveCount(2);
  await expect(page.locator('.item-row-meta').first()).toContainText('34 个词条');
});

test('Vocabulary tab: entries, cover meanings, 认识 / 不认识', async ({ page }, info) => {
  await page.goto(`/#/p/zkv/${ITEM}`);
  await expect(page.getByRole('tab', { name: /Vocabulary/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.entry')).toHaveCount(34);
  await expect(page.locator('.entry').first()).toContainText('能力，才能，本领');
  await page.getByRole('button', { name: /展开/ }).first().click();
  await expect(page.locator('.entry').first().locator('.entry-extra')).toHaveCount(2);
  await expect(page.locator('.entry').first()).toContainText('enable');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-vocab.png` });

  // #113: what 三级 / G6下U1 / * mean
  await expect(page.locator('.vocab-legend')).toContainText('英语课程标准三级词汇');
  await expect(page.locator('.vocab-legend')).toContainText('高频词汇');
  // #112: the tabs sit in the middle of the header
  const head = (await page.locator('.reader-head').boundingBox())!;
  const tabs = (await page.locator('.mode-tabs').boundingBox())!;
  expect(Math.abs(tabs.x + tabs.width / 2 - (head.x + head.width / 2))).toBeLessThan(2);

  await page.getByRole('switch', { name: '遮住释义' }).click();
  await expect(page.locator('.entry-senses')).toHaveCount(0);
  await page.locator('.entry').first().getByRole('button', { name: '认识', exact: true }).click();
  await page.locator('.entry').nth(1).getByRole('button', { name: '不认识' }).click();
  await expect(page.locator('.vocab-tally')).toHaveText('认识 1 · 不认识 1');
  await page.locator('.entry').nth(2).getByRole('button', { name: '看释义' }).click();
  await expect(page.locator('.entry').nth(2).locator('.entry-senses')).toContainText('大约');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-vocab-cover.png` });
});

test('Quiz: Part pages, typed answers only, Enter, result, review, entry, retry mistakes', async ({ page }, info) => {
  await mockJudge(page);
  await seed(page, rightAnswers(['q1', 'q2']));
  await page.goto(`/#/p/zkv/${ITEM}`);
  await expect(page.getByRole('tab', { name: /Quiz/ })).toHaveAttribute('aria-selected', 'true'); // an attempt in progress opens the quiz
  await expect(page.locator('.section-instruction')).toContainText('Part 1. 根据所给音标写出英语单词、词性及中文释义');
  // pager: one Part per page, labelled P1… with its question numbers, like the one-page Parts of KET / PET (#114)
  await expect(page.locator('.question-dot')).toHaveCount(6);
  await expect(page.locator('.question-dot').nth(1)).toHaveAttribute('data-part', 'P2');
  await expect(page.locator('.question-dot').nth(1)).toContainText('6–20');
  // no hints, no voice input (#115 #116)
  await expect(page.locator('.vq-row')).toHaveCount(5);
  await expect(page.getByRole('button', { name: /提示|语音/ })).toHaveCount(0);

  // q1: word and meaning on one line, 词性 below (#117); Enter goes from the word to the meaning
  const word1 = page.getByRole('textbox', { name: '第 1 题：单词' });
  await word1.fill('accident');
  await word1.press('Enter');
  await expect(page.getByRole('textbox', { name: '第 1 题：中文释义' })).toBeFocused();
  await page.keyboard.type('事故');
  await page.getByRole('radiogroup', { name: '第 1 题：词性' }).getByRole('radio', { name: 'n.', exact: true }).click();
  const box = async (name: string) => (await page.getByRole('textbox', { name }).boundingBox())!;
  expect(Math.abs((await box('第 1 题：单词')).y - (await box('第 1 题：中文释义')).y)).toBeLessThan(2);
  const label = (await page.locator('.vq-row').first().locator('.vq-pos-label').boundingBox())!;
  expect(Math.abs(label.x - (await box('第 1 题：单词')).x)).toBeLessThan(4);
  // q2: a misspelt word
  await page.getByRole('textbox', { name: '第 2 题：单词' }).fill('abord');
  await page.getByRole('radiogroup', { name: '第 2 题：词性' }).getByRole('radio', { name: 'adv.', exact: true }).click();
  await page.getByRole('textbox', { name: '第 2 题：中文释义' }).fill('在国外');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-quiz-1.png` });

  // Part 2: the answer lines on the right (#118); Part 4 / 5: the KET / PET blank with (word) / first letter (#121 #122)
  await page.getByRole('button', { name: /^Part 2/ }).click();
  const lines = page.locator('.vq-answer-cell .blank-input');
  await expect(lines).toHaveCount(15);
  const right = await Promise.all([0, 5, 10].map(async (i) => (await lines.nth(i).boundingBox())!.x + (await lines.nth(i).boundingBox())!.width));
  expect(Math.max(...right) - Math.min(...right)).toBeLessThan(2);
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-quiz-2.png` });
  await page.getByRole('button', { name: /^Part 3/ }).click();
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-quiz-3.png` });
  await page.getByRole('button', { name: /^Part 4/ }).click();
  await expect(page.locator('.vq-row').first().locator('.blank-input-base')).toHaveText('(cross)');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-quiz-4.png` });
  await page.getByRole('button', { name: /^Part 5/ }).click();
  await expect(page.locator('.vq-row').first().locator('.blank-input-prefix')).toHaveText('a');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-quiz-5.png` });

  await page.getByRole('button', { name: /^Part 6/ }).click();
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-quiz-6.png` });
  await page.getByRole('button', { name: '提交' }).click();

  // q2 earns 2 × 2/3, the rest full marks (translations: mocked judge)
  await expect(page.locator('.vq-result-title')).toHaveText('恭喜，通过了！');
  await expect(page.locator('.vq-result-score')).toContainText('得分 99.3 / 100');
  await expect(page.locator('.vq-result-label').first()).toHaveText('Part 1');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-result.png` });

  await page.getByRole('button', { name: /查看答案/ }).click();
  await expect(page.locator('.vq-row').first()).toHaveClass(/is-correct/);
  await expect(page.locator('.vq-row').nth(1)).toHaveClass(/is-wrong/);
  await expect(page.locator('.vq-row').nth(1).locator('.vq-answer')).toContainText('abroad');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-review.png` });
  await page.locator('.vq-row').nth(1).getByRole('button', { name: '查看词条' }).click();
  await expect(page.getByRole('dialog', { name: 'abroad' })).toContainText('在国外');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-entry.png` });
  await page.getByRole('button', { name: '关闭' }).click();

  await page.getByRole('button', { name: /^Part 6/ }).click();
  await expect(page.locator('.judge-score').first()).toContainText('4');
  await page.getByRole('button', { name: '返回成绩' }).click();
  await page.getByRole('button', { name: /只练错题/ }).click();
  await expect(page.locator('.vq-row.is-kept')).toHaveCount(4);
  await expect(page.getByRole('textbox', { name: '第 2 题：单词' })).toBeEditable();
  await expect(page.getByRole('textbox', { name: '第 1 题：单词' })).not.toBeEditable();
});
