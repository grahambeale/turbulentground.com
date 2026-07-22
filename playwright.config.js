// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// BASE_URL defaults to production. Override (e.g. to a Vercel preview
// deployment URL) via env var when running locally against a branch.
const baseURL = process.env.SMOKE_TEST_BASE_URL || 'https://turbulentground.com';

module.exports = defineConfig({
  testDir: './tests/smoke',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0, // one retry in CI absorbs a single flaky
  // network blip; a real, repeatable break still fails after the retry.
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
