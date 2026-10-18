// Layout & interaction restoration baseline (docs/14 iron rule): the RC source page for every item,
// every viewport, after fonts are ready. Run on demand:  REFERENCE=1 npx playwright test e2e/reference.spec.ts
//   .work/reference/public/<project>/<itemId>-1-start.png    first question + article (no answers) — shareable
//   .work/reference/private/<project>/<itemId>-2-review.png  after submitting (shows correct answers) — private
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.skip(!process.env.REFERENCE, 'set REFERENCE=1 to capture the reference set');

const catalog = JSON.parse(readFileSync('content/catalog.json', 'utf8')) as { playlists: { id: string; items: { id: string }[] }[] };
const items = catalog.playlists.flatMap((p) => p.items.map((i) => ({ pl: p.id, id: i.id })));

const ready = async (page: Page) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
};

for (const { pl, id } of items) {
  test(`reference ${id}`, async ({ page }, info) => {
    const narrow = (page.viewportSize()?.width ?? 1440) < 1024;
    const pub = `.work/reference/public/${info.project.name}`;
    const priv = `.work/reference/private/${info.project.name}`;
    await page.goto(`/#/p/${pl}/${id}`);
    await expect(page.locator('.article-title')).toBeVisible();
    await ready(page);
    if (narrow) {
      await page.screenshot({ path: `${pub}/${id}-1-start-article.png` });
      await page.getByRole('tab', { name: /题目/ }).click();
      await ready(page);
    }
    await page.screenshot({ path: `${pub}/${id}-1-start.png` });

    await page.locator('.question-dot').last().click();
    await page.getByRole('button', { name: '提交' }).click();
    const force = page.getByRole('button', { name: '仍然提交' });
    if (await force.isVisible()) await force.click();
    await page.getByRole('button', { name: /^第 1 题/ }).click();
    await ready(page);
    await page.screenshot({ path: `${priv}/${id}-2-review.png` });
  });
}
