/**
 * Playwright configuration for cross-browser testing.
 * @description Comprehensive test configuration supporting multiple browsers and environments.
 * @fileoverview Playwright test configuration with CI/CD optimization
 */

import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright test configuration.
 * @description Configures test execution across multiple browsers with CI/CD optimizations.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'Chrome',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'Safari',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Edge',
      use: { ...devices['Desktop Edge'] }
    },
    {
      name: 'Opera',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run build && npx serve . -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
