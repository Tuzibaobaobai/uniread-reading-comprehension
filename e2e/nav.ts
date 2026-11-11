// The quiz footer (Figma question-nav 19802:13269 for 时文阅读, question-nav-part 19706:145652 for 真题 / PET).
// 时文: one number per page (.question-dot). 真题 / PET: the Parts as cards; only the current Part shows its question
// numbers (.part-q), so going to a question may first open its Part.
import type { Page } from '@playwright/test';

/** every question number currently in the footer */
export const numbers = (page: Page) => page.locator('.question-nav .question-dot, .part-nav .part-q');

/** tap the footer number whose accessible name matches (e.g. /第 25 题/), opening its Part first on exam papers */
export async function goQuestion(page: Page, name: RegExp) {
  const button = () => page.locator('.question-nav, .part-nav').getByRole('button', { name }).first();
  if (await button().count()) return button().click();
  const kickers = await page.locator('.part-nav button.part-card').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.part));
  for (const k of kickers) {
    await page.locator(`.part-nav button.part-card[data-part="${k}"]`).click();
    if (await button().count()) return button().click();
  }
  throw new Error(`no footer number ${name}`);
}

/** open a Part of an exam paper by its card ("P2") */
export const openPart = (page: Page, part: number) => page.locator(`.part-nav button.part-card[data-part="P${part}"]`).click();

/** the last page (where 提交 / 重新作答 is) */
export async function lastPage(page: Page) {
  if (await page.locator('.part-nav').count()) {
    const last = page.locator('.part-nav .part-card').last();
    if ((await last.evaluate((e) => e.tagName)) === 'BUTTON') await last.click();
    await page.locator('.part-nav .part-q').last().click();
  } else await page.locator('.question-nav .question-dot').last().click();
}
