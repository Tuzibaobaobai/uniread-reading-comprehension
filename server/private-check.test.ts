import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findLeaks } from './private-check';

describe('private material check', () => {
  it('flags a public file that contains a key explanation, and passes a clean one', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rc-pub-'));
    await mkdir(join(dir, 'a'), { recursive: true });
    await writeFile(join(dir, 'a/clean.js'), 'console.log("hello")');
    expect(await findLeaks(dir)).toEqual([]);
    const key = (await import('../content/playlists/ci-g7/keys/ci-g7-w01-mon.json')).default as { answers: Record<string, { explanationZh: string }> };
    await writeFile(join(dir, 'a/leak.js'), `const x = ${JSON.stringify(key.answers.q1.explanationZh)}`);
    const leaks = await findLeaks(dir);
    expect(leaks.length).toBeGreaterThan(0);
    expect(leaks[0]).toContain('leak.js');
  });

  it('checks a key against its own item file, not against other items that share an ordinary phrase', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rc-pub-'));
    const key = (await import('../content/playlists/ci-g7/keys/ci-g7-w01-mon.json')).default as { answers: Record<string, { explanationZh: string }> };
    const text = JSON.stringify({ v: key.answers.q1.explanationZh });
    await mkdir(join(dir, 'playlists/x/items'), { recursive: true });
    await writeFile(join(dir, 'playlists/x/items/other-item.json'), text);
    expect(await findLeaks(dir)).toEqual([]);
    await mkdir(join(dir, 'playlists/ci-g7/items'), { recursive: true });
    await writeFile(join(dir, 'playlists/ci-g7/items/ci-g7-w01-mon.json'), text);
    expect((await findLeaks(dir))[0]).toContain('ci-g7-w01-mon.json');
  });
});
