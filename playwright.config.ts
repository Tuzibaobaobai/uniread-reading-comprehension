import { defineConfig } from '@playwright/test';

// Uses the locally installed Google Chrome (channel: 'chrome'); iPad sizes are emulated with touch.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:5199', channel: 'chrome', screenshot: 'only-on-failure' },
  webServer: { command: 'npx vite build --logLevel warn && npx vite preview --port 5199 --strictPort', url: 'http://localhost:5199', reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'ipad-landscape', use: { viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } },
    { name: 'ipad-portrait', use: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } },
  ],
});
