// Add the API functions to a prebuilt Vercel output (Build Output API v3). Run after `vercel build --prod`;
// `npm run deploy` does build → this → deploy. Each function gets content/playlists (items + keys) so keys
// stay server-side; the static site (dist) has keys stripped by the Vite plugin in vite.config.ts.
//   POST /api/rc/grade  server/grade.ts   — objective grading + key after submit
//   POST /api/rc/judge  server/judge.ts   — LLM judge (SILICONFLOW_API_KEY)
//   POST /api/rc/speak  server/speak.ts   — speech-to-text for speaking answers (SILICONFLOW_API_KEY)
import { build } from 'esbuild';
import { cp, glob, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

if (!existsSync('.vercel/output/config.json')) {
  console.error('run `vercel build --prod` first');
  process.exit(1);
}
for await (const leaked of glob('.vercel/output/static/playlists/*/keys')) {
  console.error(`answer keys found in the static output (${leaked}) — refusing to deploy`);
  process.exit(1);
}

for (const name of ['grade', 'judge', 'speak']) {
  const out = `.vercel/output/functions/api/rc/${name}.func`;
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await build({
    entryPoints: [`server/${name}.ts`],
    outfile: `${out}/index.mjs`,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    tsconfig: 'tsconfig.json',
    logLevel: 'warning',
  });
  await cp('content/playlists', `${out}/content/playlists`, { recursive: true });
  await writeFile(
    `${out}/.vc-config.json`,
    JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', maxDuration: name === 'grade' ? 10 : name === 'judge' ? 60 : 30 }, null, 2),
  );
  console.log(`${name} function → ${out}`);
}
