import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node scripts/serve.js',
    env: { PORT: '4174' },
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false
  }
});
