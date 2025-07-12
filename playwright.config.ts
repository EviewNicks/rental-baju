import { defineConfig, devices } from '@playwright/test'

// Use process.env.PORT by default and fallback to port 3000
const PORT = process.env.PORT || 3000

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: '__tests__/playwright',
  webServer: {
    command: 'yarn app:prod',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  timeout: 120 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  outputDir: 'services/test-results',
  reporter: [
    ['html', { outputFolder: 'services/playwright-report' }],
    ['json', { outputFile: 'services/test-results/results.json' }],
  ],
  use: {
    baseURL: baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'global setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '__tests__/playwright/.clerk/user.json',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-blink-features=AutomationControlled',
          ],
        },
      },
      dependencies: ['global setup'],
    },
  ],
})
