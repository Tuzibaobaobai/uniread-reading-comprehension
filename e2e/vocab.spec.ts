// 词汇天天练 (#110, docs/16): Vocabulary | Quiz tabs, cover-meanings self-check, one 大题 per page, Enter to the next
// field, hint tiles (half marks), voice input only for Chinese meanings / 中译英, submit → result → review → entry,
// 只练错题.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// a fake microphone for the voice-input test (the speech recognition itself is stubbed)
test.use({ launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }, permissions: ['microphone'] });

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
    } else if ('slots' in k)
      responses[q.id] = Object.fromEntries(Object.entries(k.slots as Record<string, { accept: string[] }>).map(([b, s]) => [b, s.accept[0]]));
    else responses[q.id] = k.sampleAnswer;
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

  await page.getByRole('switch', { name: '遮住释义' }).click();
  await expect(page.locator('.entry-senses')).toHaveCount(0);
  await page.locator('.entry').first().getByRole('button', { name: '认识', exact: true }).click();
  await page.locator('.entry').nth(1).getByRole('button', { name: '不认识' }).click();
  await expect(page.locator('.vocab-tally')).toHaveText('认识 1 · 不认识 1');
  await page.locator('.entry').nth(2).getByRole('button', { name: '看释义' }).click();
  await expect(page.locator('.entry').nth(2).locator('.entry-senses')).toContainText('大约');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-vocab-cover.png` });
});

test('Quiz: pages, Enter, voice only on meanings / translations, hint at half marks, result, review, entry, retry mistakes', async ({ page }, info) => {
  await mockJudge(page);
  await seed(page, rightAnswers(['q1', 'q2']));
  await page.goto(`/#/p/zkv/${ITEM}`);
  await expect(page.getByRole('tab', { name: /Quiz/ })).toHaveAttribute('aria-selected', 'true'); // an attempt in progress opens the quiz
  await expect(page.locator('.section-instruction')).toContainText('根据所给音标写出英语单词、词性及中文释义');

  // voice input: one per Chinese meaning on page 一, none for spelling (二), one per translation (六)
  await expect(page.locator('.vq-row')).toHaveCount(5);
  await expect(page.locator('.voice-btn')).toHaveCount(5);
  await page.getByRole('button', { name: /第二大题/ }).click();
  await expect(page.locator('.vq-row')).toHaveCount(15);
  await expect(page.locator('.voice-btn')).toHaveCount(0);
  await page.getByRole('button', { name: /第六大题/ }).click();
  await expect(page.locator('.voice-btn')).toHaveCount(5);
  await page.getByRole('button', { name: /第一大题/ }).click();

  // q1 with the hint: tap the letters of "accident" in order
  const word1 = page.getByRole('textbox', { name: '第 1 题：单词' });
  await page.getByRole('button', { name: /第 1 题：单词：提示/ }).click();
  const tiles = page.locator('.vq-row').first().locator('.hint-tile');
  await expect(tiles).toHaveCount(8);
  for (const ch of 'accident') await tiles.filter({ hasText: new RegExp(`^${ch}$`) }).and(page.locator(':enabled')).first().click();
  await expect(word1).toHaveValue('accident');
  await expect(page.locator('.vq-row').first().locator('.vq-hinted')).toHaveText('已提示');
  await page.getByRole('radiogroup', { name: '第 1 题：词性' }).getByRole('radio', { name: 'n.', exact: true }).click();
  // Enter goes to the next field
  await word1.focus();
  await word1.press('Enter');
  await expect(page.getByRole('textbox', { name: '第 1 题：中文释义' })).toBeFocused();
  await page.keyboard.type('事故');
  // q2: a misspelt word
  await page.getByRole('textbox', { name: '第 2 题：单词' }).fill('abord');
  await page.getByRole('radiogroup', { name: '第 2 题：词性' }).getByRole('radio', { name: 'adv.', exact: true }).click();
  await page.getByRole('textbox', { name: '第 2 题：中文释义' }).fill('在国外');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-quiz-1.png` });

  await page.getByRole('button', { name: /第六大题/ }).click();
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-quiz-6.png` });
  await page.getByRole('button', { name: '提交' }).click();

  // q1 earns 2 × (½ + 1 + 1) / 3, q2 2 × 2/3, the rest full marks (translations: mocked judge)
  await expect(page.locator('.vq-result-title')).toHaveText('恭喜，通过了！');
  await expect(page.locator('.vq-result-score')).toContainText('得分 99 / 100');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-result.png` });

  await page.getByRole('button', { name: /查看答案/ }).click();
  const row1 = page.locator('.vq-row').first();
  await expect(row1).toContainText('用了提示，得一半分');
  await expect(page.locator('.vq-row').nth(1)).toHaveClass(/is-wrong/);
  await expect(page.locator('.vq-row').nth(1).locator('.vq-answer')).toContainText('abroad');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-review.png` });
  await page.locator('.vq-row').nth(1).getByRole('button', { name: '查看词条' }).click();
  await expect(page.getByRole('dialog', { name: 'abroad' })).toContainText('在国外');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-entry.png` });
  await page.getByRole('button', { name: '关闭' }).click();

  await page.getByRole('button', { name: /第六大题/ }).click();
  await expect(page.locator('.judge-score').first()).toContainText('4');
  await page.getByRole('button', { name: '返回成绩' }).click();
  await page.getByRole('button', { name: /只练错题/ }).click();
  await expect(page.locator('.vq-row.is-kept')).toHaveCount(4);
  await expect(page.getByRole('textbox', { name: '第 2 题：单词' })).toBeEnabled();
  await expect(page.getByRole('textbox', { name: '第 1 题：单词' })).toBeDisabled();
});

test.describe('voice input', () => {
  test('a Chinese meaning by voice (speech recognition stubbed)', async ({ page }) => {
    let part = '';
    await page.route('**/api/rc/transcribe', async (route) => {
      part = (route.request().postDataJSON() as { part: string }).part;
      await route.fulfill({ json: { text: '事故。' } });
    });
    await seed(page, {});
    await page.goto(`/#/p/zkv/${ITEM}`);
    await page.getByRole('tab', { name: /Quiz/ }).click();
    const mic = page.locator('.vq-row').first().getByRole('button', { name: '语音输入' });
    await mic.click();
    await page.waitForTimeout(600);
    await page.locator('.vq-row').first().getByRole('button', { name: '停止录音' }).click();
    await expect(page.getByRole('textbox', { name: '第 1 题：中文释义' })).toHaveValue('事故');
    expect(part).toBe('zh');
  });
});
