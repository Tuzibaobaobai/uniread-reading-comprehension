// Not a test of behaviour: captures screenshots of every page for visual review → .work/screens/
import { test } from '@playwright/test';

const items = ['ci-g3-w01-mon', 'ci-g3-w01-wed', 'ci-g3-w01-fri', 'ci-g3-w03-thu', 'ci-xsc-w06-mon', 'ci-xsc-w12-thu', 'ci-xsc-w10-thu'];

test('screens', async ({ page }, info) => {
  const dir = `.work/screens/${info.project.name}`;
  await page.goto('/');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir}/0-playlists.png` });
  await page.goto('/#/p/ci-g3');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir}/1-playlist.png` });
  for (const id of items) {
    await page.goto(`/#/p/${id.split('-w')[0]}/${id}`);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${dir}/2-${id}.png` });
  }
});
