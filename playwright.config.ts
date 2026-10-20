import { defineConfig } from '@playwright/test';
export default defineConfig({
  outputDir: './test-results/development',
  testDir: './tests', testIgnore: '**/production/**', testMatch: '**/*.spec.ts', timeout: 120_000,
  expect: { timeout: 10_000 }, workers: 1, fullyParallel: false,
  use: { baseURL: process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5182', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: { command: 'pnpm dev --port 5182', url: 'http://127.0.0.1:5182', reuseExistingServer: !process.env.CI, timeout: 30_000 },
});
