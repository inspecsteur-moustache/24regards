import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/base',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4174',
    url: 'http://127.0.0.1:4174/24regards/',
    reuseExistingServer: false,
  },
});
