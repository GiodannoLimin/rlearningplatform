import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/production', timeout: 120_000, workers: 1,
  expect: { timeout: 15_000 },
  use: { baseURL: 'http://127.0.0.1:4174/course/', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: { command: 'node tests/serve-production.mjs', url: 'http://127.0.0.1:4174/course/', reuseExistingServer: !process.env.CI, timeout: 30_000 },
});
