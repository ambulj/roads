import { defineConfig, devices } from '@playwright/test';

const isWin = process.platform === 'win32';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'on-first-retry', viewport: { width: 1440, height: 900 } },
  webServer: { command: `${isWin ? 'npm.cmd' : 'npm'} run dev -- --host 127.0.0.1 --port 4173`, url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
