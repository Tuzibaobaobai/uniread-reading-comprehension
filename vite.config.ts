/// <reference types="vitest" />
import { defineConfig, loadEnv, type Connect, type Plugin, type UserConfig } from 'vite';
import { rm } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import grade from './server/grade';
import judge from './server/judge';
import speak from './server/speak';
import hint from './server/hint';
import transcribe from './server/transcribe';
import { findLeaks } from './server/private-check';

/**
 * Serve the same API as the Vercel functions in dev and preview (docs/06), and keep answer keys
 * off the static site: /playlists/<pl>/keys/* is blocked in dev and removed from the build output.
 */
function api(): Plugin {
  const mount = (mw: Connect.Server) => {
    mw.use('/api/rc/grade', (req, res) => void grade(req, res));
    mw.use('/api/rc/judge', (req, res) => void judge(req, res));
    mw.use('/api/rc/speak', (req, res) => void speak(req, res));
    mw.use('/api/rc/hint', (req, res) => void hint(req, res));
    mw.use('/api/rc/transcribe', (req, res) => void transcribe(req, res));
    mw.use((req, res, next) => (/^\/playlists\/[^/]+\/keys\//.test(req.url ?? '') ? ((res.statusCode = 404), res.end()) : next()));
  };
  return {
    name: 'rc-api',
    configureServer: (server) => mount(server.middlewares),
    configurePreviewServer: (server) => mount(server.middlewares),
    async closeBundle() {
      for await (const dir of glob('dist/playlists/*/keys')) await rm(dir, { recursive: true, force: true });
      // fail the build if any answer / explanation text reached the public output (docs/14 §5)
      const leaks = await findLeaks('dist');
      if (leaks.length) throw new Error(`private answer material in public build:\n${leaks.slice(0, 10).join('\n')}`);
    },
  };
}
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  // the /api/rc/* handlers read process.env (as on Vercel): give them .env / .env.local in dev and preview too
  // (docs/09 §2); variables already set in the shell win. Not for unit tests (mode "test") or the e2e server
  // (RC_NO_DOTENV=1, playwright.config.ts): they must not call the real model / speech services
  if (mode !== 'test' && !process.env.RC_NO_DOTENV)
    for (const [k, v] of Object.entries(loadEnv(mode, process.cwd(), ''))) if (process.env[k] === undefined) process.env[k] = v;
  return config;
});

const config = {
  plugins: [react(), api()],
  // content/ is served as static files at the site root (/catalog.json, /playlists/…, /assets/…)
  publicDir: 'content',
  // keep bundled JS/CSS away from content/assets
  build: { assetsDir: '_app' },
  resolve: {
    alias: {
      '@schema': fileURLToPath(new URL('./schema/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'server/**/*.test.ts'] },
} satisfies UserConfig;
