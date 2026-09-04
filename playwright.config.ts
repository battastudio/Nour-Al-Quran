import { defineConfig, devices } from '@playwright/test';

// RTL smoke tests at mobile width (390px). Reuses the vite dev server.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5183/Nour-Al-Quran/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5183/Nour-Al-Quran/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
