// 词汇天天练 (#110, docs/16): Scan | Study | Quiz tabs (#133), one Part per page, Enter to the next
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
  await expect(page.locator('.item-row')).toHaveCount(70);
  await expect(page.locator('.item-row-meta').first()).toContainText('34 个词条');
  await expect(page.locator('.item-row-title').first()).toHaveText('第1天 ability – against');
  await expect(page.locator('.item-row-title').last()).toHaveText('第70天 freeze – will');
  await page.goto('/#/p/gkv');
  await expect(page.locator('.item-row')).toHaveCount(125);
});

test('Scan (#142): every card shown plays its audio once, the first card too', async ({ page }) => {
  await page.addInitScript(() => {
    const played: string[] = ((window as unknown as { played: string[] }).played = []);
    HTMLMediaElement.prototype.play = function () {
      played.push(this.src);
      return Promise.resolve();
    };
  });
  await page.goto(`/#/p/zkv/${ITEM}`);
  await expect(page.locator('.scan-word')).toHaveText('ability');
  const played = () => page.evaluate(() => (window as unknown as { played: string[] }).played);
  await expect.poll(played).toHaveLength(1); // the first card
  await page.getByRole('button', { name: '下一个词' }).click();
  await expect(page.locator('.scan-count')).toHaveText('2/34');
  await expect.poll(played).toHaveLength(2);
  await page.getByRole('button', { name: '认识', exact: true }).click(); // a mark moves on → plays the 3rd word
  await expect.poll(played).toHaveLength(3);
  await page.getByRole('button', { name: '上一个词' }).click();
  await expect.poll(played).toHaveLength(4);
  const srcs = await played();
  expect(new Set(srcs.slice(0, 3)).size).toBe(3);
  expect(srcs[3]).toBe(srcs[1]);
});

test('Scan → Study (#133): one word a page, 认识 / 不认识, Study coloured and folded by the marks', async ({ page }, info) => {
  await page.goto(`/#/p/zkv/${ITEM}`);
  await expect(page.getByRole('tab')).toHaveText([/速览/, /学习/, /测验/]);
  await expect(page.getByRole('tab', { name: /速览/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.reader-head-title')).toHaveText('第1天 ability – against');
  // #112: the tabs sit in the middle of the header
  const head = (await page.locator('.reader-head').boundingBox())!;
  const tabs = (await page.locator('.mode-tabs').boundingBox())!;
  expect(Math.abs(tabs.x + tabs.width / 2 - (head.x + head.width / 2))).toBeLessThan(2);

  // Scan: headword + IPA only, n/total
  await expect(page.locator('.scan-word')).toHaveText('ability');
  await expect(page.locator('.scan-ipa')).toContainText('/');
  await expect(page.locator('.scan-count')).toHaveText('1/34');
  await expect(page.locator('.vocab-scan')).not.toContainText('能力');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-scan.png` });
  await page.getByRole('button', { name: '认识', exact: true }).click();
  await expect(page.locator('.scan-count')).toHaveText('2/34');
  await page.getByRole('button', { name: '不认识' }).click();
  await expect(page.locator('.scan-count')).toHaveText('3/34');

  // Study: 1st green + folded, 2nd red + open, 3rd (not marked) red + open
  await page.getByRole('tab', { name: /学习/ }).click();
  await expect(page.locator('.entry')).toHaveCount(34);
  await expect(page.locator('.vocab-tally')).toContainText('认识 1 · 不认识 33');
  await expect(page.locator('.vocab-tally')).toContainText('32 个词还没在速览中标注');
  const [first, second, third] = [0, 1, 2].map((i) => page.locator('.entry').nth(i));
  await expect(first).toHaveClass(/is-known/);
  await expect(first.locator('.entry-senses')).toHaveCount(0);
  await expect(second).toHaveClass(/is-unknown/);
  await expect(second.locator('.entry-senses')).toBeVisible();
  await expect(third).toHaveClass(/is-unknown/);
  const green = await first.locator('.entry-word').evaluate((el) => getComputedStyle(el).color);
  const red = await second.locator('.entry-word').evaluate((el) => getComputedStyle(el).color);
  expect(green).not.toBe(red);
  // fold / unfold by hand
  await first.getByRole('button', { name: '展开 ability' }).click();
  await expect(first.locator('.entry-senses')).toContainText('能力，才能，本领');
  await second.getByRole('button', { name: /^收起/ }).click();
  await expect(second.locator('.entry-senses')).toHaveCount(0);
  await first.getByRole('button', { name: /展开：/ }).click();
  await expect(first.locator('.entry-extra')).toHaveCount(2);
  await expect(first).toContainText('enable');
  // #134: 名师点拨 folded until asked for
  const above = page.locator('.entry[data-entry="e-above"]');
  await expect(above.locator('.entry-tip p')).toHaveCount(0);
  await above.getByRole('button', { name: '名师点拨' }).click();
  await expect(above.locator('.entry-tip p').first()).toBeVisible();
  // #131: the example's play button looks like the headword's
  const icon = async (sel: string) => (await above.locator(sel).first().boundingBox())!.width;
  expect(await icon('.entry-play.is-small img')).toBe(await icon('.entry-head .entry-play img'));
  // #113: what 三级 / G6下U1 / * mean
  await expect(page.locator('.vocab-legend')).toContainText('英语课程标准三级词汇');
  await expect(page.locator('.vocab-legend')).toContainText('高频词汇');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-study.png` });

  // change a mark in Scan → Study follows
  await page.getByRole('tab', { name: /速览/ }).click();
  await expect(page.locator('.scan-count')).toHaveText('3/34');
  await page.getByRole('button', { name: '上一个词' }).click();
  await page.getByRole('button', { name: '上一个词' }).click();
  await expect(page.getByRole('button', { name: '认识', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '不认识' }).click();
  await page.getByRole('tab', { name: /学习/ }).click();
  await expect(page.locator('.entry').first()).toHaveClass(/is-unknown/);
  await expect(page.locator('.entry').first().locator('.entry-senses')).toBeVisible();

  // marking every word ends on the summary; reopening the day goes straight to Study
  await page.getByRole('tab', { name: /速览/ }).click();
  for (let i = 1; i < 34; i++) await page.getByRole('button', { name: '认识', exact: true }).click();
  await expect(page.locator('.scan-done-title')).toHaveText('今天的 34 个词都标注好了');
  await expect(page.locator('.scan-done-tally')).toHaveText('认识 33 · 不认识 1');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-scan-done.png` });
  await page.reload();
  await expect(page.getByRole('tab', { name: /学习/ })).toHaveAttribute('aria-selected', 'true');
});

test('graded stars (#139): * / ** / *** as printed, legend explains the levels used that day', async ({ page }) => {
  await page.goto('/#/p/zkv/zkv-d05');
  await page.getByRole('tab', { name: /学习/ }).click();
  // the designer's 3.07: one gold star icon per printed *, the meaning in the title / label
  const because = page.locator('.entry[data-entry="e-because"] .entry-star');
  await expect(because.locator('img')).toHaveCount(3);
  await expect(because).toHaveAttribute('title', '在市毕业考试卷中多次出现的高频词汇');
  const legend = page.locator('.vocab-legend');
  await expect(legend).toContainText('在各区统考试卷中出现的高频词汇');
  await expect(legend).toContainText('在市毕业考试卷中多次出现的高频词汇');
  await expect(legend).not.toContainText('各类试卷中多次出现的高频词汇');
  // 高考 has one star level: the plain legend
  await page.goto('/#/p/gkv/gkv-d003');
  await page.getByRole('tab', { name: /学习/ }).click();
  await expect(page.locator('.entry-star').filter({ has: page.locator('img:nth-child(2)') })).toHaveCount(0);
});

test('Quiz: Part pages, typed answers only, Enter, result, review, entry, retry mistakes', async ({ page }, info) => {
  await mockJudge(page);
  await seed(page, rightAnswers(['q1', 'q2']));
  await page.goto(`/#/p/zkv/${ITEM}`);
  await expect(page.getByRole('tab', { name: /测验/ })).toHaveAttribute('aria-selected', 'true'); // an attempt in progress opens the quiz
  await expect(page.locator('.section-instruction')).toContainText('Part 1. 根据所给音标写出英语单词、词性及中文释义');
  // footer (the designer's question-nav): one Part per page — the current Part opens into its question numbers, the others
  // are cards "P2 · Q6–Q20" with how many questions are answered
  await expect(page.locator('.part-card')).toHaveCount(6);
  await expect(page.locator('.part-card').nth(1)).toHaveAttribute('data-part', 'P2');
  await expect(page.locator('.part-card').nth(1)).toContainText('Q6–Q20');
  await expect(page.locator('.part-card').nth(1)).toContainText('15/15');
  await expect(page.locator('.part-card.is-current .part-q')).toHaveText(['1', '2', '3', '4', '5']);
  await expect(page.locator('.part-card.is-current .part-q.is-answered')).toHaveCount(3); // q3–q5 answered, q1–q2 left empty
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
  // "英文单词：" and "词性：" start at the same x (the labelled rows of the designer's WordProfileRow)
  const label = (await page.locator('.vq-row').first().locator('.vq-pos-label').boundingBox())!;
  const wordLabel = (await page.locator('.vq-row').first().locator('.vq-field-label').first().boundingBox())!;
  expect(Math.abs(label.x - wordLabel.x)).toBeLessThan(4);
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
  // #140: a whole-number score, and each Part as questions right / questions (q2 is only partly right)
  await expect(page.locator('.vq-result-score')).toContainText('得分 99 / 100（60 分及格）');
  // the designer's 3.24 / 3.25: a card per Part — P1, Q1–Q5, a dash per question (right green / wrong red), 4/5
  await expect(page.locator('.vq-result-label').first()).toHaveText('P1');
  await expect(page.locator('.vq-result-range').first()).toHaveText('Q1–Q5');
  await expect(page.locator('.vq-result-bar').first().locator('i.is-right')).toHaveCount(4);
  await expect(page.locator('.vq-result-bar').first().locator('i.is-wrong')).toHaveCount(1);
  await expect(page.locator('.vq-result-points').first()).toHaveText('4/5');
  await expect(page.locator('.vq-result-points').nth(1)).toHaveText('15/15');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-result.png` });

  await page.getByRole('button', { name: /查看答案/ }).click();
  await expect(page.locator('.vq-row').first()).toHaveClass(/is-correct/);
  await expect(page.locator('.vq-row').nth(1)).toHaveClass(/is-wrong/);
  // #140: no per-question points (some 高考 blanks are worth 0.88)
  await expect(page.locator('.vq-row').nth(1)).not.toContainText(/\d+(\.\d+)?\/\d+(\.\d+)? 分/);
  await expect(page.locator('.vq-row').nth(1).locator('.vq-answer')).toContainText('abroad');
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-review.png` });
  await page.locator('.vq-row').nth(1).getByRole('button', { name: '查看词条' }).click();
  await expect(page.getByRole('dialog', { name: 'abroad' })).toContainText('到（在）国外');
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

test('高考 scores in whole numbers (#140): Part = right / questions, no 0.88-point blanks shown', async ({ page }, info) => {
  await page.goto('/#/p/gkv/gkv-d002');
  await page.getByRole('tab', { name: /测验/ }).click();
  await page.locator('.vq-row').first().getByRole('textbox').first().fill('achieve'); // worth 15/17 of a point
  await page.getByRole('button', { name: /^Part 4/ }).click();
  await page.getByRole('button', { name: '提交' }).click();
  const confirm = page.getByRole('dialog').getByRole('button', { name: /提交/ });
  if (await confirm.count()) await confirm.click();
  await expect(page.locator('.vq-result-score')).toContainText('得分 1 / 100（60 分及格）');
  await expect(page.locator('.vq-result-points')).toHaveText(['1/34', '0/15', '0/10', '0/10']);
  await page.getByRole('button', { name: /查看答案/ }).click();
  await expect(page.locator('.vq-row').first()).toContainText('回答正确');
  await expect(page.locator('.vq-row').first()).not.toContainText('0.88');
  // #128: the other Parts' cards show right / total, not ✓ / ✗; the current Part's numbers are green / red
  await expect(page.locator('.part-result-count')).toHaveText(['0/15', '0/10', '0/10']);
  await expect(page.locator('.part-card.is-current .part-q.is-correct')).toHaveCount(1);
  await expect(page.locator('.part-card.is-current .part-q.is-wrong')).toHaveCount(33);
  await page.screenshot({ path: `.work/screens/${info.project.name}/gkv-review-pager.png` });
  await page.goto('/#/p/gkv');
  await expect(page.getByText('得分 1/100')).toBeVisible();
});

test('Quiz table days (第69–70天): the printed table with a blank in each answer cell', async ({ page }, info) => {
  await page.goto('/#/p/zkv/zkv-d69');
  await page.getByRole('tab', { name: /测验/ }).click();
  const table = page.locator('.vq-table .rt-table').first();
  await expect(table.locator('th').first()).toHaveText('主格');
  const cells = table.locator('input');
  await expect(cells).toHaveCount(32);
  // a table question has no row of its own while answering
  await expect(page.locator('.vq-row')).toHaveCount(0);
  await cells.nth(0).fill('me');
  await cells.nth(1).fill('your');
  await expect(page.getByRole('group', { name: /已完成 2\/32/ })).toBeVisible();
  // a 32-question Part scrolls its numbers inside its card: every other Part card stays in the footer (no "+N" button),
  // the hidden side fades, and a mouse wheel scrolls the numbers sideways
  const nav = (await page.locator('.part-nav .question-strip').boundingBox())!;
  for (const card of await page.locator('.part-nav .part-card').all()) {
    const b = (await card.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(nav.x - 1);
    expect(b.x + b.width).toBeLessThanOrEqual(nav.x + nav.width + 1);
  }
  await expect(page.locator('.part-nav .strip-more')).toHaveCount(0);
  const qs = page.locator('.part-card.is-current .part-qs');
  await expect(qs).toHaveClass(/has-more-end/);
  await qs.hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => qs.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(qs).toHaveClass(/has-more-start/);
  await page.screenshot({ path: `.work/screens/${info.project.name}/zkv-table.png` });
  await page.getByRole('button', { name: /^Part 4/ }).click();
  await expect(page.locator('.vq-table .rt-table input')).toHaveCount(32); // 16 verbs × past / past participle
  await page.getByRole('button', { name: '提交' }).click();
  const confirm = page.getByRole('dialog').getByRole('button', { name: /提交/ });
  if (await confirm.count()) await confirm.click();
  await expect(page.locator('.vq-result-score')).toContainText('得分 1 / 100');
  await page.getByRole('button', { name: /查看答案/ }).click();
  // the table has no rows of its own; its right answers are one fold under it (the designer's 3.31): the cells not right, by number
  await expect(page.locator('.vq-row')).toHaveCount(0);
  await expect(page.locator('.vq-table .blank-input.is-correct')).toHaveCount(1);
  await expect(page.locator('.vq-table + .vq-review .vq-answer')).toContainText('2. you');
  await expect(page.locator('.vq-table + .vq-review .vq-answer')).not.toContainText('1. me');
  // review footer: a 26-question Part's dashes fit its narrow card, so the current Part keeps at least five numbers in view
  await expect(page.locator('.part-card.is-current')).toHaveAttribute('data-part', 'P1'); // the review opens on Part 1
  for (const card of await page.locator('.part-nav .part-card:not(.is-current)').all())
    expect((await card.boundingBox())!.width).toBeLessThanOrEqual(96); // 72 as drawn (scaled down below 1000px)
  const q = (await page.locator('.part-card.is-current .part-q').first().boundingBox())!.width; // 40 at the 1000px design width
  expect((await page.locator('.part-card.is-current .part-qs').boundingBox())!.width).toBeGreaterThanOrEqual(5 * q);

  await page.goto('/#/p/zkv/zkv-d70');
  await page.getByRole('tab', { name: /测验/ }).click();
  await expect(page.locator('.vq-table .rt-table')).toHaveCount(4);
  // can / may / shall / will: past tense only, as printed
  await expect(page.locator('.vq-table input')).toHaveCount(91 * 2 - 4);
});
