/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
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
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
});
