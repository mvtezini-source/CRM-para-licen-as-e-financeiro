import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30 * 1000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10 * 1000,
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3000'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});

