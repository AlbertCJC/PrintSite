// Playwright configuration for PrintSite browser E2E tests.
// Scoped to *.spec.js so Vitest *.test.ts files are not picked up.
const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: 'tests',
  testMatch: /.*\.spec\.js$/,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
})
