// Deploy the develop branch to its own Vercel project (uniread-reading-comprehension-dev) for reviewing the next
// milestone; production (`npm run deploy`, project uniread-reading-comprehension) is not touched. The production link
// in .vercel/project.json stays as it is: the dev project is chosen with VERCEL_PROJECT_ID for these commands only.
// Env vars (SILICONFLOW_API_KEY, JUDGE_*) are set once in the dev project, as Sensitive.
//   npm run deploy:dev
import { execFileSync } from 'node:child_process';

const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
if (branch !== 'develop') {
  console.error(`deploy:dev deploys the develop branch only (current: ${branch})`);
  process.exit(1);
}
const env = { ...process.env, VERCEL_ORG_ID: 'team_jUuY3kHkTlVIQwIjjKbGdw6E', VERCEL_PROJECT_ID: 'prj_e3xb7x9KVVcjezpu02zOFogBT35X' };
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', env });
run('vercel', ['build', '--prod']);
run('node', ['scripts/vercel-functions.mjs']);
run('vercel', ['deploy', '--prebuilt', '--prod']);
